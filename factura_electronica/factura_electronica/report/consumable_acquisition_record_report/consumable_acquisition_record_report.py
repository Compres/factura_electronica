# Copyright (c) 2020, Frappe, Si Hay Sistema and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
import datetime
# from erpnext.accounts.report.utils import convert  # value, from_, to, date
import json
import pandas as pd
from frappe import _

# We import all the queries we will program in the queries file
from factura_electronica.factura_electronica.report.consumable_acquisition_record_report.queries import *

def execute(filters=None):
    columns, data = get_columns(), get_data(filters)
    return columns, data


def get_columns():
    """
    Asigna las propiedades para cada columna que va en el reporte

    Args:
        filters (dict): Filtros front end

    Returns:
        list: Lista de diccionarios
    """

    columns = [
        {
            "label": _("Posting Date"),
            "fieldname": "car_date",
            "fieldtype": "Date",
            "width": 150
        },
        {
            "label": _("Document Type and ID"),
            "fieldname": "doc_type_id",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("Supplier"),
            "fieldname": "supplier",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("Invoice Date"),
            "fieldname": "invoice_date",
            "fieldtype": "Date",
            "options": "currency",
            "width": 200
        },
        {
            "label": _("Amount for Document"),
            "fieldname": "amount",
            "fieldtype": "Currency",
            "options": "currency",
            "width": 200
        },
        {
            "label": _("Currency"),
            "fieldname": "currency",
            "fieldtype": "Link",
            "options": "Currency",
            "hidden": 1
        },
    ]

    return columns

def get_data(filters):
    document = 'FAC-COMPRA-00021'
    empty_row = {}
    data = [empty_row]
    row1 = {
        "car_date": "06-07-2020",
        "doc_type_id": "<strong>FAC-COMPRA-00021</strong>",
        "supplier": "Cafe Bar S.A.",
        "invoice_date": "06-07-2020",
        "amount": "300.00",
        "currency": "GTQ"
    }
    row2 = {
        "car_date": "06-07-2020",
        "doc_type_id": "<strong>FAC-COMPRA-00021</strong>",
        "supplier": "Cafe Bar S.A.",
        "invoice_date": "06-07-2020",
        "amount": "300.00",
        "currency": "GTQ"
    }
    row3 = {
        "car_date": "06-07-2020",
        "doc_type_id": "<strong>FAC-COMPRA-00021</strong>",
        "supplier": "Cafe Bar S.A.",
        "invoice_date": "06-07-2020",
        "amount": "300.00",
        "currency": "GTQ"
    }
    row4 = {
        "car_date": "06-07-2020",
        "doc_type_id": "<strong>FAC-COMPRA-00021</strong>",
        "supplier": "Cafe Bar S.A.",
        "invoice_date": "06-07-2020",
        "amount": "300.00",
        "currency": "GTQ"
    }

    data.append(row1)
    data.append(row2)
    data.append(row3)
    data.append(row4)

    return data


# Generate links to documents found.
def apply_on_site_links(document):
    try:
        """Applies links for offsite reports such as excel
        Args:
            payable_data_line (object): The object contains the key
            value pairs for the query, this function will replace
            the key 'doc_id' with an html link, referring to the site.
        """
        site_erp = get_site_name(frappe.local.site)

        for line in document:
            # obtain the value of the doc_id key
            this_doc_type = line['doc_type_id']

            if this_doc_type == 'Sales Invoice':
                link_doc_type = 'Sales%20Invoice'
            elif this_doc_type == 'Purchase Invoice':
                link_doc_type = 'Purchase%20Invoice'
            elif this_doc_type == 'Journal Entry':
                link_doc_type = 'Journal%20Entry'
            else:
                link_doc_type = 'Sales%20Invoice'

            link_ref = f'#Form/{link_doc_type}/{this_doc_id}'
            assembled = f'<a href="{link_ref}">{this_doc_id}</a>'
            line.update({"doc_id": assembled})
        return document
    except:
        frappe.msgprint(frappe.get_traceback())
