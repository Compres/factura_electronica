# Copyright (c) 2020, Si Hay Sistema and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import json
from datetime import date

import frappe
from factura_electronica.utils.formulas import amount_converter, apply_formula_isr
from frappe import _


# Constante con montos fijos para escenarios ISR
TASAS_ISR = (0.05, 0.07,)
RANGO_ISR = (0, 30000,)


# PARA SALES INVOICE
class JournalEntryISR():
    def __init__(self, data_invoice, is_isr_ret, is_iva_ret, cost_center,
                 debit_in_acc_currency, is_multicurrency, descr):
        """
        Constructor de la clase

        Args:
            data_factura (Object Class Invoice): Instancia de la clase Sales Invoice
            no_ref (str): Numero de autorizacion
            f_ref (str): Fecha de autorizacion
            id_f (str): Referencia a factura
            centro_costo (str): Centro de costo a utilizar en poliza
        """
        self.company = data_invoice.get("company")
        self.posting_date = data_invoice.get("posting_date")
        self.posting_time = data_invoice.get("posting_time", "")
        self.grand_total = data_invoice.get("grand_total")
        self.debit_to = data_invoice.get("debit_to")
        self.currency = data_invoice.get("currency")
        self.curr_exch = data_invoice.get("conversion_rate")  # Se usara el de la factura ya generada
        self.customer = data_invoice.get("customer")
        self.name_inv = data_invoice.get("name")
        self.cost_center = cost_center
        self.debit_in_acc_currency = debit_in_acc_currency
        self.is_multicurrency = is_multicurrency
        self.remarks = descr
        self.docstatus = 0
        self.rows_journal_entry = []
        self.is_isr_retention = int(is_isr_ret)
        self.is_iva_retention = int(is_iva_ret)
        self.amount_rentetion_isr = 0

    def create(self):
        '''Funcion encargada de crear journal entry haciendo referencia a x factura'''
        try:
            # Obtenemos el centro de costo default para la empresa, esto puede ser modifcado manualmente
            if not self.cost_center:
                self.cost_center = frappe.db.get_value("Company", {"name": self.company}, "cost_center")

            # VALIDAMOS LAS DEPENDENCIAS

            # Escenario 1 - POLIZA NORMAL, FACTURA DE VENTA
            if self.is_iva_retention == 0 and self.is_isr_retention == 0:
                status_dep = self.validate_dependencies()
                if status_dep[0] == False:
                    return False, status_dep[1]

                status_rows = self.apply_normal_scenario()

            # Escenario 2 - POLIZA CON RETENCION ISR, FACTURA DE VENTA
            elif self.is_iva_retention == 0 and self.is_isr_retention == 1:
                status_dep = self.validate_dependencies()
                if status_dep[0] == False:
                    return False, status_dep[1]

                status_rows = self.apply_isr_scenario()

            # TODO: ESCENARIO 3 - RETENCION ISR Y RETENCION IVA

            else:
                return False, 'No se recibio ninguna opcion para generar Poliza contable'

            JOURNALENTRY = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "company": self.company,
                "posting_date": self.posting_date,
                "user_remark": self.remarks,
                "accounts": self.rows_journal_entry,
                "multi_currency": self.is_multicurrency,
                "docstatus": 0
            })
            status_journal = JOURNALENTRY.insert(ignore_permissions=True)

        except:
            return False, 'Error datos para crear journal entry '+str(frappe.get_traceback())

        else:

            if self.is_isr_retention == 1:
                ret = 'ISR'
            # Registrar retencion
            register_withholding({
                'retention_type': ret or 'ISR',
                'party_type': 'Sales Invoice',
                'company': self.company,
                'tax_id': '',
                'sales_invoice': self.name_inv,
                'invoice_date': self.posting_date,
                'grand_total': self.grand_total,
                'currency': self.currency

            })

            return True, status_journal.name

    def validate_dependencies(self):
        try:

            # Obtenemos la cuenta para retencion isr configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.isr_account_payable = frappe.db.get_value("Tax Witholding Ranges", {"parent": self.company},
                                                               "isr_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para ISR retencion configurada'

            # Obtenemos la cuenta para retencion iva configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.iva_account_payable = frappe.db.get_values("Tax Witholding Ranges", {"parent": self.company},
                                                                "iva_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para IVA retencion configurada'

            return True, 'OK'

        except:
            return False, str(frappe.get_traceback())

    def apply_isr_scenario(self):
        try:
            # Logica posible fila 1
            # Moneda de la cuenta por cobrar
            curr_row_a = frappe.db.get_value("Account", {"name": self.debit_to}, "account_currency")

            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row = 1 if (curr_row_a == "GTQ") else self.curr_exch

            row_one = {
                "account": self.debit_to,  # Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": '{0:.2f}'.format(amount_converter(self.grand_total, self.curr_exch,
                                                                                from_currency=self.currency,
                                                                                to_currency=curr_row_a)),  #Valor del monto a acreditar
                "debit_in_account_currency": 0,  #Valor del monto a debitar
                "exchange_rate": exch_rate_row,  # Tipo de cambio
                "account_currency": curr_row_a,
                "party_type": "Customer",  #Tipo de tercero: Proveedor, Cliente, Estudiante, Accionista, Etc. SE USARA CUSTOMER UA QUE VIENE DE SALES INVOICE
                "party": self.customer,  #Nombre del cliente
                "reference_name": self.name_inv,  #Referencia dada por sistema
                "reference_type": "Sales Invoice"
            }
            self.rows_journal_entry.append(row_one)

            # Logica posible fila 2
            # moneda de la cuenta
            curr_row_b = frappe.db.get_value("Account", {"name": self.debit_in_acc_currency},
                                             "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_b = 1 if (curr_row_b == "GTQ") else self.curr_exch

            # VALIDACION GRAND TOTAL DE FACTURA
            # Para una correcta validacion convertimos los montos a quetzales, si la factura esta en quetzales
            # se usara el mismo monto
            grand_total_gtq = amount_converter(self.grand_total, self.curr_exch,
                                               from_currency=self.currency, to_currency='GTQ')

            # El monto en quetzales lo pasamos a la funcion que calcula automaticamente el ISR
            ISR_PAYABLE_GTQ = apply_formula_isr(self.grand_total, self.name_inv, self.company)
            ISR_IN_CURRENCY_ACC = amount_converter(ISR_PAYABLE_GTQ, self.curr_exch,
                                                   from_currency='GTQ', to_currency=curr_row_b)

            # El monto que me quedara sin el isr
            amt_without_isr = self.grand_total - ISR_IN_CURRENCY_ACC
            calc_row_two = amount_converter(amt_without_isr, self.curr_exch,
                                            from_currency=self.currency, to_currency=curr_row_b)

            row_two = {
                "account": self.debit_in_acc_currency,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_b,  # Tipo de cambio
                "account_currency": curr_row_b,  # Moneda de la cuenta
                "debit_in_account_currency": '{0:.2f}'.format(calc_row_two),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_two)

            # Logica posible fila 3
            # moneda de la cuenta
            curr_row_c = frappe.db.get_value("Account", {"name": self.isr_account_payable}, "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_c = 1 if (curr_row_c == "GTQ") else self.curr_exch
            isr_curr_acc = amount_converter(ISR_PAYABLE_GTQ, self.curr_exch, from_currency=self.currency, to_currency=curr_row_c)

            row_three = {
                "account": self.isr_account_payable,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_c,  # Tipo de cambio
                "account_currency": curr_row_c,  # Moneda de la cuenta
                "debit_in_account_currency": '{0:.2f}'.format(isr_curr_acc),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_three)

        except:
            return False, str(frappe.get_traceback())

        else:
            return True, 'OK'

    def apply_isr_iva_scenario(self):
        pass

    def apply_normal_scenario(self):

        # En el escenario normal, generamos filas simples
        self.rows_journal_entry = [
            {
                'account': self.debit_to, 'party_type': 'Customer', 'party': self.customer,
                'reference_type': 'Sales Invoice', 'reference_name': self.name_inv,
                'credit_in_account_currency': self.grand_total, 'cost_center': self.cost_center
            },
            {
                'account': self.debit_in_acc_currency, 'debit_in_account_currency': self.grand_total,
                'cost_center': self.cost_center
            }
        ]

        return True, 'OK'



# PARA FACTURA ESPECIAL - PURCHASE INVOICE

class JournalEntrySpecialISR():
    def __init__(self, data_invoice, cost_center, credit_in_acc_currency, is_multicurrency, descr):
        """
        Constructor de la clase

        Args:
            data_factura (Object Class Invoice): Instancia de la clase Purchase Invoice
            no_ref (str): Numero de autorizacion
            f_ref (str): Fecha de autorizacion
            id_f (str): Referencia a factura
            centro_costo (str): Centro de costo a utilizar en poliza
        """
        self.company = data_invoice.get("company")
        self.posting_date = data_invoice.get("posting_date")
        self.posting_time = data_invoice.get("posting_time", "")
        self.grand_total = data_invoice.get("grand_total")
        self.grand_total_currency_company = data_invoice.get("base_grand_total")
        self.credit_to = data_invoice.get("credit_to")
        self.currency = data_invoice.get("currency")
        self.curr_exch = data_invoice.get("conversion_rate")  # Se usara el de la factura ya generada
        self.supplier = data_invoice.get("supplier")
        self.name_inv = data_invoice.get("name")
        self.base_net_total = data_invoice.get("base_total_taxes_and_charges")  # IVA EN moneda de company
        self.cost_center = cost_center
        self.credit_in_acc_currency = credit_in_acc_currency
        self.is_multicurrency = is_multicurrency
        self.remarks = descr
        self.docstatus = 0
        self.rows_journal_entry = []
        self.amount_rentetion_isr = 0

    def create(self):
        '''Funcion encargada de crear journal entry haciendo referencia a x factura'''
        try:
            # Si no se detecta ningun centro de costo usamos el default de la compania
            if not self.cost_center:
                self.cost_center = frappe.db.get_value("Company", {"name": self.company}, "cost_center")

            # Validamos las dependencias necesarias para crear el journal entry
            status_dep = self.validate_dependencies()
            if status_dep[0] == False:
                return False, status_dep[1]

            # Aplicamos los calculos para el escenario factura especial, con retencion ISR e IVA
            status_rows = self.apply_special_inv_scenario()

            # Creamos un nuevo objeto de la clase Journal Entry
            JOURNALENTRY = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "company": self.company,
                "posting_date": self.posting_date,
                "user_remark": self.remarks,
                "accounts": self.rows_journal_entry,
                "multi_currency": self.is_multicurrency,
                "docstatus": 0
            })
            status_journal = JOURNALENTRY.insert(ignore_permissions=True)

        except:
            return False, 'Error datos para crear journal entry '+str(frappe.get_traceback())

        else:

            # if self.is_isr_retention == 1:
            #     ret = 'ISR'
            # # Registrar retencion
            # register_withholding({
            #     'retention_type': ret or 'ISR',
            #     'party_type': 'Purchase Invoice',
            #     'company': self.company,
            #     'tax_id': '',
            #     'sales_invoice': self.name_inv,
            #     'invoice_date': self.posting_date,
            #     'grand_total': self.grand_total,
            #     'currency': self.currency

            # })

            return True, status_journal.name

    def validate_dependencies(self):
        try:
            # Obtenemos la cuenta para retencion isr configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.isr_account_payable = frappe.db.get_value("Tax Witholding Ranges", {"parent": self.company},
                                                               "isr_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para ISR retencion configurada'

            # Obtenemos la cuenta para retencion iva configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.iva_account_payable = frappe.db.get_value("Tax Witholding Ranges", {"parent": self.company},
                                                                "iva_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para IVA retencion configurada'

            return True, 'OK'

        except:
            return False, str(frappe.get_traceback())

    def apply_special_inv_scenario(self):
        try:
            # -------------------------------------------------------------------------------------------------------------------------
            # FILA 1: El monto acordado con supplier
            # obtenemos la moneda de la cuenta por pagar
            curr_row_a = frappe.db.get_value("Account", {"name": self.credit_to}, "account_currency")

            # Si la moneda de la cuenta es igual a la de company, se usa tipo cambio 1
            # si la moneda de la cuenta es diferente de la de company, se usa el tipo cambio especificado
            # COMPARAR CON MONEDA DE COMPANY
            exch_rate_row = 1 if (curr_row_a == "GTQ") else self.curr_exch

            row_one = {
                "account": self.credit_to,  # Cuenta por pagar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "debit_in_account_currency": '{0:.2f}'.format(amount_converter(self.grand_total, self.curr_exch,
                                                                               from_currency=self.currency,
                                                                               to_currency=curr_row_a)),  # convierte el monto a la moneda de la cuenta
                "credit_in_account_currency": 0,
                "exchange_rate": exch_rate_row,  # Tipo de cambio
                "account_currency": curr_row_a,  # moenda de la cuenta
                "party_type": "Supplier",  # Tipo de tercero: Proveedor, Cliente, Estudiante, Accionista, Etc. SE USARA CUSTOMER UA QUE VIENE DE SALES INVOICE
                "party": self.supplier,
                "reference_name": self.name_inv,  # Referencia dada por sistema
                "reference_type": "Purchase Invoice"
            }
            self.rows_journal_entry.append(row_one)


            # -------------------------------------------------------------------------------------------------------------------------
            # FILA 2: MONTO QUE EN REALIDAD SE PAGARA, GRAND TOTAL MENOS ISR, MENOS IVA, que saldra de caja
            # moneda de la cuenta, CUENTA QUE SALDARA LA DEUDA
            curr_row_b = frappe.db.get_value("Account", {"name": self.credit_in_acc_currency},
                                             "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_b = 1 if (curr_row_b == "GTQ") else self.curr_exch

            # VALIDACION GRAND TOTAL DE FACTURA
            # Para una correcta validacion usamos el grand total en la moneda de company "GTQ"
            grand_total_gtq = self.grand_total_currency_company

            # Obtenemos el monto sin IVA del grand total moneda de company "GTQ"
            GRAND_TOTAL_NO_IVA = grand_total_gtq/1.12
            IVA_OPE = GRAND_TOTAL_NO_IVA * 0.12

            # convertimos el monto a la moneda de la cuenta en caso aplique
            GRAND_TOTAL_IVA_ACC = amount_converter(GRAND_TOTAL_NO_IVA, self.curr_exch,
                                                   from_currency="GTQ", to_currency=curr_row_b)

            # El monto en quetzales lo pasamos a la funcion que calcula automaticamente el ISR
            ISR_PAYABLE_GTQ = apply_formula_isr(GRAND_TOTAL_NO_IVA, self.name_inv, self.company)
            # Convertimso el ISR a la moneda de la cuenta, en cas aplique
            ISR_IN_CURRENCY_ACC = amount_converter(ISR_PAYABLE_GTQ, self.curr_exch,
                                                   from_currency="GTQ", to_currency=curr_row_b)

            # El monto que me quedara sin el isr ni el iva, la operacion se realiza con montos
            # convetidos a la moneda de la cuenta, para mantener consistencia en los mntos
            amt_without_isr_iva = (grand_total_gtq - (IVA_OPE + ISR_PAYABLE_GTQ))
            # frappe.msgprint(str(amt_without_isr_iva))
            # Se vuelve a validar la conversion en caso aplique
            calc_row_two = amt_without_isr_iva  #amount_converter(amt_without_isr_iva, self.curr_exch,
            #                                 from_currency=self.currency, to_currency=curr_row_b)

            row_two = {
                "account": self.credit_in_acc_currency,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "debit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_b,  # Tipo de cambio
                "account_currency": curr_row_b,  # Moneda de la cuenta
                "credit_in_account_currency": '{0:.2f}'.format(calc_row_two),
            }
            self.rows_journal_entry.append(row_two)

            # FILA 3: IVA a retener
            # moneda de la cuenta
            curr_row_c = frappe.db.get_value("Account", {"name": self.iva_account_payable}, "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_c = 1 if (curr_row_c == "GTQ") else self.curr_exch
            iva_curr_acc = amount_converter((GRAND_TOTAL_NO_IVA*0.12), self.curr_exch, from_currency="GTQ", to_currency=curr_row_c)

            row_three = {
                "account": self.iva_account_payable,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "debit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_c,  # Tipo de cambio
                "account_currency": curr_row_c,  # Moneda de la cuenta
                "credit_in_account_currency": '{0:.2f}'.format(iva_curr_acc),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_three)

            # FILA 4: RETENCION ISR
            # moneda de la cuenta
            curr_row_d = frappe.db.get_value("Account", {"name": self.isr_account_payable}, "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_d = 1 if (curr_row_d == "GTQ") else self.curr_exch
            isr_curr_acc = amount_converter(ISR_PAYABLE_GTQ, self.curr_exch, from_currency="GTQ", to_currency=curr_row_c)

            row_four = {
                "account": self.isr_account_payable,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "debit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_d,  # Tipo de cambio
                "account_currency": curr_row_d,  # Moneda de la cuenta
                "credit_in_account_currency": '{0:.2f}'.format(isr_curr_acc),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_four)

            with open('special.json', 'w') as f:
                f.write(json.dumps(self.rows_journal_entry, default=str, indent=2))

        except:
            frappe.msgprint(str(frappe.get_traceback()))
            return False, str(frappe.get_traceback())

        else:
            return True, 'OK'



class JournalEntryAutomatedRetention():
    def __init__(self, data_invoice, is_isr_ret, is_iva_ret, cost_center,
                 debit_in_acc_currency, is_multicurrency, description):
        """
        Constructor de la clase

        Args:
            data_factura (Object Class Invoice): Instancia de la clase Sales Invoice
            no_ref (str): Numero de autorizacion
            f_ref (str): Fecha de autorizacion
            id_f (str): Referencia a factura
            centro_costo (str): Centro de costo a utilizar en poliza
        """
        self.company = data_invoice.get("company")
        self.posting_date = data_invoice.get("posting_date")
        self.posting_time = data_invoice.get("posting_time", "")
        self.grand_total = data_invoice.get("grand_total")
        self.debit_to = data_invoice.get("debit_to")
        self.currency = data_invoice.get("currency")
        self.curr_exch = data_invoice.get("conversion_rate")  # Se usara el de la factura ya generada
        self.customer = data_invoice.get("customer")
        self.name_inv = data_invoice.get("name")
        self.cost_center = cost_center
        self.debit_in_acc_currency = debit_in_acc_currency
        self.is_multicurrency = is_multicurrency
        self.remarks = description
        self.docstatus = 0
        self.rows_journal_entry = []
        self.is_isr_retention = int(is_isr_ret)
        self.is_iva_retention = int(is_iva_ret)
        self.amount_rentetion_isr = 0

    def create(self):
        '''Funcion encargada de crear journal entry haciendo referencia a x factura'''
        try:
            # Obtenemos el centro de costo default para la empresa, esto puede ser modifcado manualmente
            if not self.cost_center:
                self.cost_center = frappe.db.get_value("Company", {"name": self.company}, "cost_center")

            # VALIDAMOS LAS DEPENDENCIAS

            # Escenario 1 - POLIZA NORMAL, FACTURA DE VENTA
            if self.is_iva_retention == 0 and self.is_isr_retention == 0:
                status_dep = self.validate_dependencies()
                if status_dep[0] == False:
                    return False, status_dep[1]

                status_rows = self.apply_normal_scenario()

            # Escenario 2 - POLIZA CON RETENCION ISR, FACTURA DE VENTA
            elif self.is_iva_retention == 0 and self.is_isr_retention == 1:
                status_dep = self.validate_dependencies()
                if status_dep[0] == False:
                    return False, status_dep[1]

                status_rows = self.apply_isr_scenario()

            # TODO: ESCENARIO 3 - RETENCION ISR Y RETENCION IVA

            else:
                return False, 'No se recibio ninguna opcion para generar Poliza contable'

            JOURNALENTRY = frappe.get_doc({
                "doctype": "Journal Entry",
                "voucher_type": "Journal Entry",
                "company": self.company,
                "posting_date": self.posting_date,
                "user_remark": self.remarks,
                "accounts": self.rows_journal_entry,
                "multi_currency": self.is_multicurrency,
                "docstatus": 0
            })
            status_journal = JOURNALENTRY.insert(ignore_permissions=True)

        except:
            return False, 'Error datos para crear journal entry '+str(frappe.get_traceback())

        else:

            if self.is_isr_retention == 1:
                ret = 'ISR'
            # Registrar retencion
            register_withholding({
                'retention_type': ret or 'ISR',
                'party_type': 'Sales Invoice',
                'company': self.company,
                'tax_id': '',
                'sales_invoice': self.name_inv,
                'invoice_date': self.posting_date,
                'grand_total': self.grand_total,
                'currency': self.currency

            })

            return True, status_journal.name

    def validate_dependencies(self):
        try:

            # Obtenemos la cuenta para retencion isr configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.isr_account_payable = frappe.db.get_value("Tax Witholding Ranges", {"parent": self.company},
                                                               "isr_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para ISR retencion configurada'

            # Obtenemos la cuenta para retencion iva configurada en company
            if frappe.db.exists("Tax Witholding Ranges", {"parent": self.company}):
                self.iva_account_payable = frappe.db.get_values("Tax Witholding Ranges", {"parent": self.company},
                                                                "iva_account_payable")
            else:
                return False, 'No se puede proceder con la generacion de poliza contable, no se encontro ninguna cuenta para IVA retencion configurada'

            return True, 'OK'

        except:
            return False, str(frappe.get_traceback())

    def apply_isr_scenario(self):
        try:
            # Logica posible fila 1
            # Moneda de la cuenta por cobrar
            curr_row_a = frappe.db.get_value("Account", {"name": self.debit_to}, "account_currency")

            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row = 1 if (curr_row_a == "GTQ") else self.curr_exch

            row_one = {
                "account": self.debit_to,  # Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": '{0:.2f}'.format(amount_converter(self.grand_total, self.curr_exch,
                                                                                from_currency=self.currency,
                                                                                to_currency=curr_row_a)),  #Valor del monto a acreditar
                "debit_in_account_currency": 0,  #Valor del monto a debitar
                "exchange_rate": exch_rate_row,  # Tipo de cambio
                "account_currency": curr_row_a,
                "party_type": "Customer",  #Tipo de tercero: Proveedor, Cliente, Estudiante, Accionista, Etc. SE USARA CUSTOMER UA QUE VIENE DE SALES INVOICE
                "party": self.customer,  #Nombre del cliente
                "reference_name": self.name_inv,  #Referencia dada por sistema
                "reference_type": "Sales Invoice"
            }
            self.rows_journal_entry.append(row_one)

            # Logica posible fila 2
            # moneda de la cuenta
            curr_row_b = frappe.db.get_value("Account", {"name": self.debit_in_acc_currency},
                                             "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_b = 1 if (curr_row_b == "GTQ") else self.curr_exch

            # Validamos que tasa isr aplica
            # validamos el monto en quetzales, si la factura esta en dolares convertimos a quetzales
            # para validar el escenario
            grand_total_gtq = amount_converter(self.grand_total, self.curr_exch,
                                               from_currency=self.currency, to_currency='GTQ')

            # Puede ser 0.05 o 0.07
            scenario = 1
            applicable_rate = TASAS_ISR[0]
            # Si es menor o igual a 30000
            if grand_total_gtq <= RANGO_ISR[1]:
                applicable_rate = TASAS_ISR[0]

            # Si es mayor de 30000
            if grand_total_gtq > RANGO_ISR[1]:
                applicable_rate = TASAS_ISR[1]
                scenario = 2

            # Calculo fila dos
            ISR_PAYABLE = apply_formula_isr(self.grand_total, self.name_inv, self.company, applicable_rate, scenario)

            amt_without_isr = (self.grand_total - ISR_PAYABLE)
            calc_row_two = amount_converter(amt_without_isr, self.curr_exch,
                                            from_currency=self.currency, to_currency=curr_row_b)

            row_two = {
                "account": self.debit_in_acc_currency,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_b,  # Tipo de cambio
                "account_currency": curr_row_b,  # Moneda de la cuenta
                "debit_in_account_currency": '{0:.2f}'.format(calc_row_two),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_two)

            # Logica posible fila 3
            # moneda de la cuenta
            curr_row_c = frappe.db.get_value("Account", {"name": self.isr_account_payable}, "account_currency")
            # Si la moneda de la cuenta es usd usara el tipo cambio de la factura
            # resultado = valor_si if condicion else valor_no
            exch_rate_row_c = 1 if (curr_row_c == "GTQ") else self.curr_exch
            isr_curr_acc = amount_converter(ISR_PAYABLE, self.curr_exch, from_currency=self.currency, to_currency=curr_row_c)

            row_three = {
                "account": self.isr_account_payable,  #Cuenta a que se va a utilizar
                "cost_center": self.cost_center,  # Otra cuenta que revisa si esta dentro del presupuesto
                "credit_in_account_currency": 0,  #Valor del monto a acreditar
                "exchange_rate": exch_rate_row_c,  # Tipo de cambio
                "account_currency": curr_row_c,  # Moneda de la cuenta
                "debit_in_account_currency": '{0:.2f}'.format(isr_curr_acc),  #Valor del monto a debitar
            }
            self.rows_journal_entry.append(row_three)

        except:
            return False, str(frappe.get_traceback())

        else:
            return True, 'OK'

    def apply_isr_iva_scenario(self):
        pass

    def apply_normal_scenario(self):

        # En el escenario normal, generamos filas simples
        self.rows_journal_entry = [
            {
                'account': self.debit_to, 'party_type': 'Customer', 'party': self.customer,
                'reference_type': 'Sales Invoice', 'reference_name': self.name_inv,
                'credit_in_account_currency': self.grand_total, 'cost_center': self.cost_center
            },
            {
                'account': self.debit_in_acc_currency, 'debit_in_account_currency': self.grand_total,
                'cost_center': self.cost_center
            }
        ]

        return True, 'OK'


def register_withholding(data_ret):
    try:
        new_record = frappe.new_doc('Tax Retention Guatemala')
        new_record.date = str(date.today())
        new_record.retention_type = data_ret.get('retention_type')
        new_record.party_type = data_ret.get('daparty_typete')
        new_record.company = data_ret.get('company')
        new_record.tax_id = data_ret.get('tax_id')
        new_record.sales_invoice = data_ret.get('sales_invoice')
        new_record.invoice_date = data_ret.get('invoice_date')
        new_record.grand_total = data_ret.get('grand_total')
        new_record.currency = data_ret.get('currency')

        new_record.save()

    except:
        pass
        # return False, f'Ocurrio un problema al tratar de registrar la poliza contable: {frappe.get_traceback()}'
    else:
        return True, 'OK'
