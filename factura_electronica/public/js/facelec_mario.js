/**
 * Copyright (c) 2017, 2018 SHS and contributors
 * For license information, please see license.txt
 */

// Funcion para los calculos necesarios.
function facelec_tax_calculation_conversion(frm, cdt, cdn) {

    // es-GT: Actualiza los datos en los campos de la tabla hija 'items'
    refresh_field('items');

    // es-GT: Se asigna a la variable el valor que encuentre en la fila 0 de la tabla hija taxes
    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    // es-GT: Esta funcion permite trabajar linea por linea de la tabla hija items
    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.facelec_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].facelec_other_tax_amount = ((item_row.facelec_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].facelec_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);

            // Verificacion Individual para verificar si es Fuel, Good o Service
            if (item_row.factelecis_fuel === 1) {
                //console.log("The item you added is FUEL!" + item_row.facelec_is_good);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (1 + (this_company_sales_tax_var / 100))).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_fuel_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_fuel_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.factelecis_fuel == true) {
                        total_fuel += flt(d.facelec_gt_tax_net_fuel_amt);
                    };
                });
                //console.log("El total neto de fuel es:" + total_fuel); // WORKS OK!
                frm.doc.facelec_gt_tax_fuel = total_fuel;
                frm.refresh_field("factelecis_fuel");
            };
            if (item_row.facelec_is_good === 1) {
                //console.log("The item you added is a GOOD!" + item_row.facelec_is_good);// WORKS OK!
                //console.log("El valor en bienes para el libro de compras es: " + net_goods_tally);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (this_company_sales_tax_var / 100)).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_goods_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_goods_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_is_good == true) {
                        total_goods += flt(d.facelec_gt_tax_net_goods_amt);
                    };
                });
                //console.log("El total neto de bienes es:" + total_goods);// WORKS OK!
                frm.doc.facelec_gt_tax_goods = total_goods;
            };
            if (item_row.facelec_is_service === 1) {
                //console.log("The item you added is a SERVICE!" + item_row.facelec_is_service);// WORKS OK!
                //console.log("El valor en servicios para el libro de compras es: " + net_services_tally);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (this_company_sales_tax_var / 100)).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_services_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_services_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));

                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_is_service == true) {
                        total_servi += flt(d.facelec_gt_tax_net_services_amt);
                    };
                });
                // console.log("El total neto de servicios es:" + total_servi); // WORKS OK!
                frm.doc.facelec_gt_tax_services = total_servi;
            };

            // Para el calculo total de IVA, basado en la sumatoria de facelec_sales_tax_for_this_row de cada item
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_sales_tax_for_this_row);
            });
            frm.doc.facelec_total_iva = full_tax_iva;
        };
    });
}

// Funcion para evitar realizar calculos con cuentas duplicadas
function buscar_account(frm, cuenta_b) {
    /**
     * Funcionamiento: recibe como parametro frm, y cuenta_b, lo que hace es, buscar en todas las filas de taxes
     * si existe ya una cuenta con el nombre de la cuenta recibida por parametro, en caso ya exista esa cuenta en
     * la tabla no hace nada, pero si encuentra que no hay una cuenta igual a la recibida en el parametro, entonces
     * la funcion encargada agregara una nueva fila con los datos correspondientes, esta funcion retorna true
     * en caso si encuentre una cuenta existente
     */
    var estado = false;
    $.each(frm.doc.taxes || [], function (i, d) {
        if (d.account_head === cuenta_b) {
            // console.log('Si Existe en el indice ' + i)
            estado = true;
        }
    });
    return estado;
}

/**
 * Funcion para validar el NIT:
 */
function valNit(nit, cus_supp, frm) {
    if (nit === "C/F" || nit === "c/f") {
        frm.enable_save(); // Activa y Muestra el boton guardar de Sales Invoice
    } else {
        var nd, add = 0;
        if (nd = /^(\d+)\-?([\dk])$/i.exec(nit)) {
            nd[2] = (nd[2].toLowerCase() == 'k') ? 10 : parseInt(nd[2]);
            for (var i = 0; i < nd[1].length; i++) {
                add += ((((i - nd[1].length) * -1) + 1) * nd[1][i]);
            }
            nit_validado = ((11 - (add % 11)) % 11) == nd[2];
        } else {
            nit_validado = false;
        }

        if (nit_validado === false) {
            msgprint('NIT de: <b>' + cus_supp + '</b>, no es correcto. Si no tiene disponible el NIT modifiquelo a <b>C/F</b>');
            frm.disable_save(); // Desactiva y Oculta el boton de guardar en Sales Invoice
        }
        if (nit_validado === true) {
            frm.enable_save(); // Activa y Muestra el boton guardar de Sales Invoice
        }
    }
}

// Funcion crea un boton que permite actualizar la serie de una factura
// con el numero de DTE. Factura Electronica
function pdf_button(cae_documento, frm) {
    // Esta funcion se encarga de mostrar el boton para obtener el pdf de la factura electronica generada
    frm.add_custom_button(__("VER PDF FACTURA ELECTRONICA"),
        function () {
            window.open("https://www.ingface.net/Ingfacereport/dtefactura.jsp?cae=" + cae_documento);
        }).addClass("btn-primary");
}

/* ---------------------------------------------------------------------------------------------------------------- */
// Se ejecuta cuando la configuracion de generacion de facturas se encuentra en 'MANUAL'
// Recibe como parametros:
// tipo_factura: Almacena el nombre del tipo de factura, este se mostrara en el texto del boton, puede ser
// 'Factura Electronica', 'Nota Credito Electronica', 'Nota Debito Electronica'
// frm: Documento que se esta trabajando
function generar_boton_factura(tipo_factura, frm) {
    frm.add_custom_button(__(tipo_factura), function () {
        // frm.reload(); permite hacer un refresh de todo el documento
        frm.reload_doc();
        let serie_de_factura = frm.doc.name;
        // Guarda la url actual
        let mi_url = window.location.href;
        frappe.call({
            method: "factura_electronica.api.generar_factura_electronica",
            args: {
                serie_factura: frm.doc.name,
                nombre_cliente: frm.doc.customer
                // pre_serie: frm.doc.naming_series
            },
            // El callback recibe como parametro el dato retornado por el script python del lado del servidor
            callback: function (data) {
                // console.log('Serie generada: ' + data.message);
                // console.log('serie original: ' + serie_de_factura);
                if (data.message !== undefined) {
                    // Crea una nueva url con el nombre del documento actualizado
                    let url_nueva = mi_url.replace(serie_de_factura, data.message);
                    // Asigna la nueva url a la ventana actual
                    window.location.assign(url_nueva);
                    frm.reload_doc();
                }
            }
        });
    }).addClass("btn-primary"); //NOTA: Se puede crear una clase para el boton CSS
}

// Se ejecuta cuando la configuracion de generacion de facturas se encuentra en 'AUTOMATICO'
// Recibe como parametros:
// frm: Documento que se esta trabajando
function generar_factura_sin_btn(frm) {
    // frm.reload(); permite hacer un refresh de todo el documento
    frm.reload_doc();
    let serie_de_factura = frm.doc.name;
    // Guarda la url actual
    let mi_url = window.location.href;
    frappe.call({
        method: "factura_electronica.api.generar_factura_electronica",
        args: {
            serie_factura: frm.doc.name,
            nombre_cliente: frm.doc.customer
            // pre_serie: frm.doc.naming_series
        },
        // El callback recibe como parametro el dato retornado por el script python del lado del servidor
        callback: function (data) {
            // console.log('Serie generada: ' + data.message);
            // console.log('serie original: ' + serie_de_factura);
            if (data.message !== undefined) {
                // Crea una nueva url con el nombre del documento actualizado
                let url_nueva = mi_url.replace(serie_de_factura, data.message);
                // Asigna la nueva url a la ventana actual
                window.location.assign(url_nueva);
                frm.reload_doc();
            } else {
                frm.reload_doc();
            }
        }
    });
}

// Funcion verifica que se haya generado el CAE, para el documento requerido, en caso no se haya
// generado mostrara un boton para hacerlo manualmente.
function verificacionCAE(modalidad, frm, cdt, cdn) {
    /* ------------------------------ COMPROBACIONES DE CAE ------------------------------ */
    // FACTURAS FACE, CFACE
    // Este codigo entra en funcionamiento cuando la generacion automatica de la factura no es exitosa.
    // esto permite volver intentarlo hasta obtener el cae de la factura en que se estre trabajando.
    if (frm.doc.status === "Paid" || frm.doc.status === "Unpaid" || frm.doc.status === "Submitted" || frm.doc.status === "Overdue") {
        // SI en el campo de 'cae_factura_electronica' ya se encuentra el dato correspondiente, ocultara el boton
        // para generar el documento, para luego mostrar el boton para obtener el PDF del documento ya generado.
        if (frm.doc.cae_factura_electronica) {
            cur_frm.clear_custom_buttons();
            pdf_button(frm.doc.cae_factura_electronica, frm);
        } else {
            // Si la modalidad recibida es manual se genera un boton para hacer la factura electronica manualmente
            if (modalidad === 'manual') {
                generar_boton_factura('Factura Electronica', frm);
            }
            // Si la modalidad recibida es automatica se realiza la factura electronica directamente
            if (modalidad === 'automatico') {
                generar_factura_sin_btn(frm);
            }
        }
    }

    // Codigo para Notas de Credito NCE
    // El codigo se ejecutara segun el estado del documento, puede ser: Retornar
    if (frm.doc.status === "Return") {
        //var nombre = 'Nota Credito';
        // SI en el campo de 'cae_nota_de_credito' ya se encuentra el dato correspondiente, ocultara el boton
        // para generar el documento, para luego mostrar el boton para obtener el PDF del documento ya generado.
        if (frm.doc.cae_factura_electronica) {
            cur_frm.clear_custom_buttons();
            pdf_button(frm.doc.cae_factura_electronica, frm);
        } else {
            // Si la modalidad recibida es manual se genera un boton para hacer la factura electronica manualmente
            if (modalidad === 'manual') {
                generar_boton_factura('Nota Credito Electronica', frm);
            }
            // Si la modalidad recibida es automatica se realiza la factura electronica directamente
            if (modalidad === 'automatico') {
                generar_factura_sin_btn(frm);
            }
        }
    }

    // Codigo para notas de debito
    // Codigo para Notas de Credito NDE
    if (frm.doc.status === "Paid" || frm.doc.status === "Unpaid" || frm.doc.status === "Submitted" || frm.doc.status === "Overdue") {
        //var nombre = 'Nota Debito';
        if (frm.doc.es_nota_de_debito) {
            cur_frm.clear_custom_buttons('Factura Electronica');
            if (frm.doc.cae_factura_electronica) {
                cur_frm.clear_custom_buttons();
                pdf_button(frm.doc.cae_factura_electronica, frm);
            } else {
                // Si la modalidad recibida es manual se genera un boton para hacer la factura electronica manualmente
                if (modalidad === 'manual') {
                    generar_boton_factura('Nota Debito Electronica', frm);
                }
                // Si la modalidad recibida es automatica se realiza la factura electronica directamente
                if (modalidad === 'automatico') {
                    generar_factura_sin_btn(frm);
                }
            }
        }
    }
    /* -------------------------------------------------------------------------------------- */
    // Funcionalidad evita copiar CAE cuando se duplica una factura
    if (frm.doc.status === 'Draft') {
        // console.log('No Guardada');
        cur_frm.set_value("cae_factura_electronica", '');
        cur_frm.set_value("serie_original_del_documento", '');
        // frm.doc.cae_factura_electronica = '';
        // frm.doc.serie_original_del_documento = '';
    }
}
/* ---------------------------------------------------------------------------------------------------------------- */

frappe.ui.form.on("Sales Invoice", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        // es-GT: Obtiene el numero de Identificacion tributaria ingresado en la hoja del cliente.
        // en-US: Fetches the Taxpayer Identification Number entered in the Customer doctype.
        cur_frm.add_fetch("customer", "nit_face_customer", "nit_face_customer");

        // WORKS OK!
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                facelec_tax_calculation_conversion(frm, "Sales Invoice Item", item.name);
            });
        });
        // Cuando el documento se actualiza, la funcion verificac de que exista un cae.
        // En caso exista un cae, mostrara un boton para ver el PDF de la factura electronica generada.
        // En caso no exista un cae mostrara el boton para generar la factura electronica
        // correspondiente a su serie.
        verificacionCAE('manual', frm, cdt, cdn);
    },
    nit_face_customer: function (frm, cdt, cdn) {
        // if (frm.doc.nit_face_customer === null) {
        //     console.log('EL NIT ES NULL')
        // }
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.nit_face_customer, frm.doc.customer, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.facelec_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.facelec_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.facelec_total_iva = (frm.doc.facelec_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_total_iva);
    },
    customer: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio customer trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            facelec_tax_calculation_conversion(frm, "Sales Invoice Item", item.name);
            tax_before_calc = frm.doc.facelec_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.facelec_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.facelec_total_iva = (frm.doc.facelec_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_total_iva);
        });
    },
    on_submit: function (frm, cdt, cdn) {
        // Ocurre cuando se presione el boton validar.
        // Cuando se valida el documento, se hace la consulta al servidor por medio de frappe.call
        // con esto se obtiene la configuracion guardada, ya sea automatico o manual
        // FUNCION AUTOMATICA: Cuando se valida el documento automaticamente genera la estrucutura para la factura solicitada
        // y realiza la peticion a INFILE para la generacion, respuesta y guardado en nuestra base de datos.
        frappe.call({
            method: "factura_electronica.api.obtenerConfiguracionManualAutomatica",
            // El callback recibe como parametro el dato retornado por script python del lado del servidor
            callback: function (data) {
                console.log(data.message)
                if (data.message === 'Manual') {
                    console.log('Configuracion encontrada: MANUAL');
                    // No es necesario tener activa esta parte, ya que cuando se ingresa a cualquier factura en el evento
                    // refresh, hay una funcion que se encarga de comprobar de que se haya generado exitosamente la 
                    // factura electronica, en caso no sea asi, se mostrarán los botones correspondientes, para hacer
                    // la generacion de la factura electronica manualmente.
                    // generarFacturaBTN(frm, cdt, cdn);
                }
                if (data.message === 'Automatico') {
                    console.log('Configuracion encontrada: AUTOMATICO');
                    // generarFacturaSINBTN(frm, cdt, cdn);
                    verificacionCAE('automatico', frm, cdt, cdn);
                }
            }
        });
    },
    // onload: function (frm, cdt, cdn) {
    //     // Cuando se carge el documento por completo realizara la comprobacion de que se haya 
    //     // generado el CAE para el documento requerido.
    //     verificacionCAE(frm, cdt, cdn);
    // },
    // onload_post_render: function (frm, cdt, cdn) {
    //     // console.log('si funciona')
    //     // console.log('Funcionando Onload Trigger'); SI FUNCIONA EL TRIGGER
    //     // Funciona unicamente cuando se carga por primera vez el documento y aplica unicamente para el form y no childtables
    //     frm.fields_dict.items.grid.wrapper.on('blur', 'input[data-fieldname="item_code"][data-doctype="Sales Invoice Item"]', function (e) {
    //         console.log("Blurring from the Rate Field");
    //         setTimeout(function () {
    //             console.log(cur_frm.doc.item_code)
    //         }, 100);
    //     });
    // }
});

frappe.ui.form.on("Sales Invoice Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // console.log('Trigger remove en tabla hija');

        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.facelec_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.facelec_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.facelec_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.facelec_sales_tax_for_this_row);
        });

        cur_frm.set_value("facelec_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("facelec_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("facelec_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("facelec_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {

        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
        // frm.doc.items.forEach((item_row, index) => {
        //     if (item_row.name == cdn) {
        //         console.log(item_row.item_code);
        //         let prueba = frappe.get_doc('Item', item_row.item_code);
        //         console.log(prueba);
        //     };
        // });

    },
    qty: function (frm, cdt, cdn) {
        //facelec_tax_calculation(frm, cdt, cdn);
        facelec_tax_calculation_conversion(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        facelec_tax_calculation_conversion(frm, cdt, cdn);
    },
    // FUNCIONA!!
    facelec_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.facelec_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        facelec_tax_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Purchase Invoice (Factura de Compra) 
// Funcion para calculo de impuestos
function shs_purchase_invoice_calculation(frm, cdt, cdn) {

    refresh_field('items');

    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.facelec_p_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].facelec_p_other_tax_amount = ((item_row.facelec_p_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].facelec_p_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_p_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.facelec_p_is_fuel == 1) {
                frm.doc.items[index].facelec_p_gt_tax_net_fuel_amt = (item_row.facelec_p_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_p_sales_tax_for_this_row = (item_row.facelec_p_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_p_is_fuel == true) {
                        total_fuel += flt(d.facelec_p_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.facelec_p_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.facelec_p_is_good == 1) {
                frm.doc.items[index].facelec_p_gt_tax_net_goods_amt = (item_row.facelec_p_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_p_sales_tax_for_this_row = (item_row.facelec_p_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_p_is_good == true) {
                        total_goods += flt(d.facelec_p_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.facelec_p_gt_tax_goods = total_goods;
            };
            if (item_row.facelec_p_is_service == 1) {
                frm.doc.items[index].facelec_p_gt_tax_net_services_amt = (item_row.facelec_p_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_p_sales_tax_for_this_row = (item_row.facelec_p_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_p_is_service == true) {
                        total_servi += flt(d.facelec_p_gt_tax_net_services_amt);
                    };
                });
                frm.doc.facelec_p_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_p_sales_tax_for_this_row);
            });
            frm.doc.facelec_p_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Purchase Invoice", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Purchase Invoice');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_purchase_invoice_calculation(frm, "Purchase Invoice Item", item.name);
            });
        });
    },
    facelec_nit_fproveedor: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.facelec_nit_fproveedor, frm.doc.supplier, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.facelec_p_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.facelec_p_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.facelec_p_total_iva = (frm.doc.facelec_p_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_p_total_iva);
    },
    supplier: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio supplier trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_purchase_invoice_calculation(frm, "Purchase Invoice Item", item.name);
            tax_before_calc = frm.doc.facelec_p_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.facelec_p_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.facelec_p_total_iva = (frm.doc.facelec_p_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_p_total_iva);
        });
    },
});

frappe.ui.form.on("Purchase Invoice Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.facelec_p_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.facelec_p_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.facelec_p_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.facelec_p_sales_tax_for_this_row);
        });

        cur_frm.set_value("facelec_p_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("facelec_p_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("facelec_p_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("facelec_p_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_purchase_invoice_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_purchase_invoice_calculation(frm, cdt, cdn);
    },
    facelec_p_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.facelec_p_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_purchase_invoice_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Purchase Quotation (Cotizacion de compra)
// Funcion para calculo de impuestos
function shs_quotation_calculation(frm, cdt, cdn) {

    refresh_field('items');

    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.facelec_qt_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].facelec_qt_other_tax_amount = ((item_row.facelec_qt_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].facelec_qt_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_qt_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.facelec_qt_is_fuel == 1) {
                frm.doc.items[index].facelec_qt_gt_tax_net_fuel_amt = (item_row.facelec_qt_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_qt_sales_tax_for_this_row = (item_row.facelec_qt_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_qt_is_fuel == true) {
                        total_fuel += flt(d.facelec_qt_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.facelec_qt_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.facelec_qt_is_good == 1) {
                frm.doc.items[index].facelec_qt_gt_tax_net_goods_amt = (item_row.facelec_qt_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_qt_sales_tax_for_this_row = (item_row.facelec_qt_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_qt_is_good == true) {
                        total_goods += flt(d.facelec_qt_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.facelec_qt_gt_tax_goods = total_goods;
            };
            if (item_row.facelec_qt_is_service == 1) {
                frm.doc.items[index].facelec_qt_gt_tax_net_services_amt = (item_row.facelec_qt_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_qt_sales_tax_for_this_row = (item_row.facelec_qt_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_qt_is_service == true) {
                        total_servi += flt(d.facelec_qt_gt_tax_net_services_amt);
                    };
                });
                frm.doc.facelec_qt_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_qt_sales_tax_for_this_row);
            });
            frm.doc.facelec_qt_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Quotation", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Quotation');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_quotation_calculation(frm, "Quotation Item", item.name);
            });
        });
    },
    facelec_qt_nit: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.facelec_qt_nit, frm.doc.customer, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.facelec_qt_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.facelec_qt_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.facelec_qt_total_iva = (frm.doc.facelec_qt_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_qt_total_iva);
    },
    customer: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio customer trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_quotation_calculation(frm, "Quotation Item", item.name);
            tax_before_calc = frm.doc.facelec_qt_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.facelec_qt_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.facelec_qt_total_iva = (frm.doc.facelec_qt_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_qt_total_iva);
        });
    },
});

frappe.ui.form.on("Quotation Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.facelec_qt_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.facelec_qt_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.facelec_qt_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.facelec_qt_sales_tax_for_this_row);
        });

        cur_frm.set_value("facelec_qt_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("facelec_qt_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("facelec_qt_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("facelec_qt_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_quotation_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_quotation_calculation(frm, cdt, cdn);
    },
    facelec_qt_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.facelec_qt_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada')
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_quotation_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Purchase Order (Orden de compra)
// Funcion para calculo de impuestos
function shs_purchase_order_calculation(frm, cdt, cdn) {
    // es-GT: Actualiza los campos de la tabla hija 'items'
    refresh_field('items');
    // es-GT: Asigna a la variable el valor rate de la tabla hija 'taxes' en la posicion 0
    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;
    // es-GT: Funcion que permite realizar los calculos necesarios dependiendo de la linea en la que se este trabajando
    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.facelec_po_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].facelec_po_other_tax_amount = ((item_row.facelec_po_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].facelec_po_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_po_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            // es-GT: Verificacion de si esta seleccionado el check Combustible
            if (item_row.facelec_po_is_fuel == 1) {
                frm.doc.items[index].facelec_po_gt_tax_net_fuel_amt = (item_row.facelec_po_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_po_sales_tax_for_this_row = (item_row.facelec_po_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_po_is_fuel == true) {
                        total_fuel += flt(d.facelec_po_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.facelec_po_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            // es-GT: Verificacion de si esta seleccionado el check Bienes
            if (item_row.facelec_po_is_good == 1) {
                frm.doc.items[index].facelec_po_gt_tax_net_goods_amt = (item_row.facelec_po_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_po_sales_tax_for_this_row = (item_row.facelec_po_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_po_is_good == true) {
                        total_goods += flt(d.facelec_po_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.facelec_po_gt_tax_goods = total_goods;
            };
            // es-GT: Verificacion de si esta seleccionado el check Servicios
            if (item_row.facelec_po_is_service == 1) {
                frm.doc.items[index].facelec_po_gt_tax_net_services_amt = (item_row.facelec_po_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_po_sales_tax_for_this_row = (item_row.facelec_po_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_po_is_service == true) {
                        total_servi += flt(d.facelec_po_gt_tax_net_services_amt);
                    };
                });
                frm.doc.facelec_po_gt_tax_services = total_servi;
            };
            // es-GT: Sumatoria para obtener el IVA total
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_po_sales_tax_for_this_row);
            });
            frm.doc.facelec_po_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Purchase Order", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Purchase Order');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_purchase_order_calculation(frm, "Purchase Order Item", item.name);
            });
        });
    },
    facelec_po_nit: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.facelec_po_nit, frm.doc.supplier, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.facelec_po_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.facelec_po_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.facelec_po_total_iva = (frm.doc.facelec_po_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_po_total_iva);
    },
    supplier: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio supplier trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_purchase_order_calculation(frm, "Purchase Order Item", item.name);
            tax_before_calc = frm.doc.facelec_po_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.facelec_po_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.facelec_po_total_iva = (frm.doc.facelec_po_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_po_total_iva);
        });
    },
});

frappe.ui.form.on("Purchase Order Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.facelec_po_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.facelec_po_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.facelec_po_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.facelec_po_sales_tax_for_this_row);
        });

        cur_frm.set_value("facelec_po_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("facelec_po_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("facelec_po_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("facelec_po_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_purchase_order_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_purchase_order_calculation(frm, cdt, cdn);
    },
    facelec_po_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.facelec_po_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_purchase_order_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Purchase Receipt (Recibo de Compra) 
// Funcion para calculo de impuestos
function shs_purchase_receipt_calculation(frm, cdt, cdn) {

    refresh_field('items');

    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.facelec_pr_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].facelec_pr_other_tax_amount = ((item_row.facelec_pr_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].facelec_pr_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_pr_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.facelec_pr_is_fuel == 1) {
                frm.doc.items[index].facelec_pr_gt_tax_net_fuel_amt = (item_row.facelec_pr_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_pr_sales_tax_for_this_row = (item_row.facelec_pr_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_pr_is_fuel == true) {
                        total_fuel += flt(d.facelec_pr_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.facelec_pr_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.facelec_pr_is_good == 1) {
                frm.doc.items[index].facelec_pr_gt_tax_net_goods_amt = (item_row.facelec_pr_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_pr_sales_tax_for_this_row = (item_row.facelec_pr_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_pr_is_good == true) {
                        total_goods += flt(d.facelec_pr_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.facelec_pr_gt_tax_goods = total_goods;
            };
            if (item_row.facelec_pr_is_service == 1) {
                frm.doc.items[index].facelec_pr_gt_tax_net_services_amt = (item_row.facelec_pr_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_pr_sales_tax_for_this_row = (item_row.facelec_pr_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_pr_is_service == true) {
                        total_servi += flt(d.facelec_pr_gt_tax_net_services_amt);
                    };
                });
                frm.doc.facelec_pr_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_pr_sales_tax_for_this_row);
            });
            frm.doc.facelec_pr_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Purchase Receipt", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Purchase Receipt');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_purchase_receipt_calculation(frm, "Purchase Receipt Item", item.name);
            });
        });
    },
    facelec_nit_prproveedor: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.facelec_nit_prproveedor, frm.doc.supplier, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.facelec_pr_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.facelec_pr_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.facelec_pr_total_iva = (frm.doc.facelec_pr_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_pr_total_iva);
    },
    supplier: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio supplier trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_purchase_receipt_calculation(frm, "Purchase Receipt Item", item.name);
            tax_before_calc = frm.doc.facelec_pr_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.facelec_pr_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.facelec_pr_total_iva = (frm.doc.facelec_pr_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.facelec_pr_total_iva);
        });
    },
});

frappe.ui.form.on("Purchase Receipt Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.facelec_pr_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.facelec_pr_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.facelec_pr_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.facelec_pr_sales_tax_for_this_row);
        });

        cur_frm.set_value("facelec_pr_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("facelec_pr_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("facelec_pr_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("facelec_pr_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_purchase_receipt_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_purchase_order_calculation(frm, cdt, cdn);
    },
    facelec_pr_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.facelec_pr_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_purchase_receipt_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Sales Order (Orden de Venta) 
// Funcion para calculo de impuestos
function shs_sales_order_calculation(frm, cdt, cdn) {

    refresh_field('items');

    let this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    let this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name === cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.shs_so_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].shs_so_other_tax_amount = ((item_row.shs_so_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].shs_so_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.shs_so_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.shs_so_is_fuel === 1) {
                frm.doc.items[index].shs_so_gt_tax_net_fuel_amt = (item_row.shs_so_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_so_sales_tax_for_this_row = (item_row.shs_so_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.shs_so_is_fuel === 1) {
                        total_fuel += flt(d.shs_so_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.shs_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.shs_so_is_good === 1) {
                frm.doc.items[index].shs_so_gt_tax_net_goods_amt = (item_row.shs_so_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_so_sales_tax_for_this_row = (item_row.shs_so_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_so_is_good === 1) {
                        total_goods += flt(d.shs_so_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.shs_so_gt_tax_goods = total_goods;
            };
            if (item_row.shs_so_is_service === 1) {
                frm.doc.items[index].shs_so_gt_tax_net_services_amt = (item_row.shs_so_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_so_sales_tax_for_this_row = (item_row.shs_so_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_so_is_service === 1) {
                        total_servi += flt(d.shs_so_gt_tax_net_services_amt);
                    };
                });
                frm.doc.shs_so_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.shs_so_sales_tax_for_this_row);
            });
            frm.doc.shs_so_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Sales Order", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Sales Order');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_sales_order_calculation(frm, "Sales Order Item", item.name);
            });
        });
    },
    shs_so_nit: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.shs_so_nit, frm.doc.customer, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.shs_so_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.shs_so_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.shs_so_total_iva = (frm.doc.shs_so_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_so_total_iva);
    },
    customer: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio supplier trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_sales_order_calculation(frm, "Sales Order Item", item.name);
            tax_before_calc = frm.doc.shs_so_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.shs_so_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.shs_so_total_iva = (frm.doc.shs_so_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_so_total_iva);
        });
    },
});

frappe.ui.form.on("Sales Order Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.shs_so_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.shs_so_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.shs_so_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.shs_so_sales_tax_for_this_row);
        });

        cur_frm.set_value("shs_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("shs_so_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("shs_so_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("shs_so_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_sales_order_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_sales_order_calculation(frm, cdt, cdn);
    },
    shs_so_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.shs_so_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_sales_order_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Delivery Note (Nota de entrega)
// Funcion para calculo de impuestos
function shs_delivery_note_calculation(frm, cdt, cdn) {

    refresh_field('items');

    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.shs_dn_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].shs_dn_other_tax_amount = ((item_row.shs_dn_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].shs_dn_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.shs_dn_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.shs_dn_is_fuel == 1) {
                frm.doc.items[index].shs_dn_gt_tax_net_fuel_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.shs_dn_is_fuel == true) {
                        total_fuel += flt(d.shs_dn_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.shs_dn_is_good == 1) {
                frm.doc.items[index].shs_dn_gt_tax_net_goods_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_dn_is_good == true) {
                        total_goods += flt(d.shs_dn_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_goods = total_goods;
            };
            if (item_row.shs_dn_is_service == 1) {
                frm.doc.items[index].shs_dn_gt_tax_net_services_amt = (item_row.shs_dn_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_dn_sales_tax_for_this_row = (item_row.shs_dn_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_dn_is_service == true) {
                        total_servi += flt(d.shs_dn_gt_tax_net_services_amt);
                    };
                });
                frm.doc.shs_dn_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.shs_dn_sales_tax_for_this_row);
            });
            frm.doc.shs_dn_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Delivery Note", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Delivery Note');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_delivery_note_calculation(frm, "Delivery Note Item", item.name);
            });
        });
    },
    shs_dn_nit: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.shs_dn_nit, frm.doc.customer, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.shs_dn_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.shs_dn_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.shs_dn_total_iva = (frm.doc.shs_dn_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_dn_total_iva);
    },
    customer: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio customer trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_delivery_note_calculation(frm, "Delivery Note Item", item.name);
            tax_before_calc = frm.doc.shs_dn_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.shs_dn_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.shs_dn_total_iva = (frm.doc.shs_dn_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_dn_total_iva);
        });
    },
});

frappe.ui.form.on("Delivery Note Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.shs_dn_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.shs_dn_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.shs_dn_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.shs_dn_sales_tax_for_this_row);
        });

        cur_frm.set_value("shs_dn_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("shs_dn_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("shs_dn_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("shs_dn_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {
        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');
    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_delivery_note_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_delivery_note_calculation(frm, cdt, cdn);
    },
    shs_dn_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.shs_dn_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_delivery_note_calculation(frm, cdt, cdn);
    }
});

// Codigo Adaptado para Supplier Quotation (Presupuesto de Proveedor)
// Funcion para calculo de impuestos
function shs_supplier_quotation_calculation(frm, cdt, cdn) {

    refresh_field('items');

    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
            this_row_amount = (item_row.qty * item_row.rate);
            this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
            this_row_tax_rate = (item_row.shs_spq_tax_rate_per_uom);
            this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
            // Convert a number into a string, keeping only two decimals:
            frm.doc.items[index].shs_spq_other_tax_amount = ((item_row.shs_spq_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
            //OJO!  No s epuede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
            frm.doc.items[index].shs_spq_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.shs_spq_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            console.log("conversion_factor is: " + item_row.conversion_factor);
            if (item_row.shs_spq_is_fuel == 1) {
                frm.doc.items[index].shs_spq_gt_tax_net_fuel_amt = (item_row.shs_spq_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_spq_sales_tax_for_this_row = (item_row.shs_spq_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                let total_fuel = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.shs_spq_is_fuel == true) {
                        total_fuel += flt(d.shs_spq_gt_tax_net_fuel_amt);
                    };
                });
                frm.doc.shs_spq_gt_tax_fuel = total_fuel;
                //frm.refresh_field("factelec_p_is_fuel");
            };
            if (item_row.shs_spq_is_good == 1) {
                frm.doc.items[index].shs_spq_gt_tax_net_goods_amt = (item_row.shs_spq_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_spq_sales_tax_for_this_row = (item_row.shs_spq_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                let total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_spq_is_good == true) {
                        total_goods += flt(d.shs_spq_gt_tax_net_goods_amt);
                    };
                });
                frm.doc.shs_spq_gt_tax_goods = total_goods;
            };
            if (item_row.shs_spq_is_service == 1) {
                frm.doc.items[index].shs_spq_gt_tax_net_services_amt = (item_row.shs_spq_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].shs_spq_sales_tax_for_this_row = (item_row.shs_spq_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check servicios
                let total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.shs_spq_is_service == true) {
                        total_servi += flt(d.shs_spq_gt_tax_net_services_amt);
                    };
                });
                frm.doc.shs_spq_gt_tax_services = total_servi;
            };
            let full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.shs_spq_sales_tax_for_this_row);
            });
            frm.doc.shs_spq_total_iva = full_tax_iva;
        };
    });
}

frappe.ui.form.on("Supplier Quotation", {
    refresh: function (frm, cdt, cdn) {
        // Trigger refresh de pagina
        console.log('Exito Script In Supplier Quotation');
        // Boton para recalcular
        frm.add_custom_button("UOM Recalculation", function () {
            frm.doc.items.forEach((item) => {
                // for each button press each line is being processed.
                console.log("item contains: " + item);
                //Importante
                shs_supplier_quotation_calculation(frm, "Supplier Quotation Item", item.name);
            });
        });
    },
    shs_spq_nit: function (frm, cdt, cdn) {
        // Funcion para validar NIT: Se ejecuta cuando exista un cambio en el campo de NIT
        valNit(frm.doc.shs_spq_nit, frm.doc.supplier, frm);
    },
    discount_amount: function (frm, cdt, cdn) {
        // Trigger Monto de descuento
        tax_before_calc = frm.doc.shs_spq_total_iva;
        console.log("El descuento total es:" + frm.doc.discount_amount);
        console.log("El IVA calculado anteriormente:" + frm.doc.shs_spq_total_iva);
        discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
        console.log("El neto sin iva del descuento es" + discount_amount_net_value);
        discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
        console.log("El IVA del descuento es:" + discount_amount_tax_value);
        frm.doc.shs_spq_total_iva = (frm.doc.shs_spq_total_iva - discount_amount_tax_value);
        console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_spq_total_iva);
    },
    supplier: function (frm, cdt, cdn) {
        // Trigger Proveedor
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log('Corrio customer trigger y se cargo el IVA, el cual es ' + this_company_sales_tax_var);
    },
    before_save: function (frm, cdt, cdn) {
        // Trigger antes de guardar
        frm.doc.items.forEach((item) => {
            // for each button press each line is being processed.
            console.log("item contains: " + item);
            //Importante
            shs_supplier_quotation_calculation(frm, "Supplier Quotation Item", item.name);
            tax_before_calc = frm.doc.shs_spq_total_iva;
            console.log("El descuento total es:" + frm.doc.discount_amount);
            console.log("El IVA calculado anteriormente:" + frm.doc.shs_spq_total_iva);
            discount_amount_net_value = (frm.doc.discount_amount / (1 + (cur_frm.doc.taxes[0].rate / 100)));
            console.log("El neto sin iva del descuento es" + discount_amount_net_value);
            discount_amount_tax_value = (discount_amount_net_value * (cur_frm.doc.taxes[0].rate / 100));
            console.log("El IVA del descuento es:" + discount_amount_tax_value);
            frm.doc.shs_spq_total_iva = (frm.doc.shs_spq_total_iva - discount_amount_tax_value);
            console.log("El IVA ya sin el iva del descuento es ahora:" + frm.doc.shs_spq_total_iva);
        });
    },
    onload: function (frm, cdt, cdn) {
        // console.log('Funcionando Onload Trigger'); SI FUNCIONA EL TRIGGER
        // Funciona unicamente cuando se carga por primera vez el documento y aplica unicamente para el form y no childtables
    },
});

frappe.ui.form.on("Supplier Quotation Item", {
    items_add: function (frm, cdt, cdn) {},
    items_move: function (frm, cdt, cdn) {},
    before_items_remove: function (frm, cdt, cdn) {},
    items_remove: function (frm, cdt, cdn) {
        // es-GT: Este disparador corre al momento de eliminar una nueva fila.
        // en-US: This trigger runs when removing a row.
        // Vuelve a calcular los totales de FUEL, GOODS, SERVICES e IVA cuando se elimina una fila.
        let fix_gt_tax_fuel = 0;
        let fix_gt_tax_goods = 0;
        let fix_gt_tax_services = 0;
        let fix_gt_tax_iva = 0;

        $.each(frm.doc.items || [], function (i, d) {
            fix_gt_tax_fuel += flt(d.shs_spq_gt_tax_net_fuel_amt);
            fix_gt_tax_goods += flt(d.shs_spq_gt_tax_net_goods_amt);
            fix_gt_tax_services += flt(d.shs_spq_gt_tax_net_services_amt);
            fix_gt_tax_iva += flt(d.shs_spq_sales_tax_for_this_row);
        });

        cur_frm.set_value("shs_spq_gt_tax_fuel", fix_gt_tax_fuel);
        cur_frm.set_value("shs_spq_gt_tax_goods", fix_gt_tax_goods);
        cur_frm.set_value("shs_spq_gt_tax_services", fix_gt_tax_services);
        cur_frm.set_value("shs_spq_total_iva", fix_gt_tax_iva);
    },
    item_code: function (frm, cdt, cdn) {

        // Trigger codigo de producto
        this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;
        console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
        refresh_field('qty');

    },
    qty: function (frm, cdt, cdn) {
        // Trigger cantidad
        shs_supplier_quotation_calculation(frm, cdt, cdn);
        console.log("cdt contains: " + cdt);
        console.log("cdn contains: " + cdn);
    },
    uom: function (frm, cdt, cdn) {
        // Trigger UOM
        console.log("The unit of measure field was changed and the code from the trigger was run");
    },
    conversion_factor: function (frm, cdt, cdn) {
        // Trigger factor de conversion
        console.log("El disparador de factor de conversión se corrió.");
        shs_supplier_quotation_calculation(frm, cdt, cdn);
    },
    shs_spq_tax_rate_per_uom_account: function (frm, cdt, cdn) {
        // Eleccion de este trigger para la adicion de filas en taxes con sus respectivos valores.
        frm.doc.items.forEach((item_row_i, index_i) => {
            if (item_row_i.name == cdn) {
                var cuenta = item_row_i.shs_spq_tax_rate_per_uom_account;
                if (cuenta !== null) {
                    if (buscar_account(frm, cuenta)) {
                        console.log('La cuenta ya existe');
                    } else {
                        console.log('La cuenta no existe, se agregara una nueva fila en taxes');
                        frappe.model.add_child(frm.doc, "Sales Taxes and Charges", "taxes");
                        frm.doc.taxes.forEach((item_row, index) => {
                            if (item_row.account_head == undefined) {
                                frappe.call({
                                    method: "factura_electronica.api.get_data_tax_account",
                                    args: {
                                        name_account_tax_gt: cuenta
                                    },
                                    // El callback recibe como parametro el dato retornado por script python del lado del servidor
                                    callback: function (data) {
                                        // Asigna los valores retornados del servidor
                                        frm.doc.taxes[index].charge_type = 'On Net Total'; // Opcion 1: Actual, Opcion 2: On Net Total, Opcion 3: On Previous Row Amount, Opcion 4: On Previous Row Total
                                        frm.doc.taxes[index].account_head = cuenta;
                                        frm.doc.taxes[index].rate = data.message;
                                        //item_row.account_head = cuenta;
                                        //refresh_field("taxes");
                                        frm.doc.taxes[index].description = 'Impuesto';
                                    }
                                });
                            }
                        });
                    }
                } else {
                    console.log('El producto seleccionado no tiene una cuenta asociada');
                }
            }
        });
    },
    rate: function (frm, cdt, cdn) {
        shs_supplier_quotation_calculation(frm, cdt, cdn);
    }
});

/** Verificacion para que exista un solo check */
frappe.ui.form.on("Item", {
    facelec_is_fuel: function (frm, cdt, cdn) {
        if (frm.doc.facelec_is_fuel) {
            cur_frm.set_value("facelec_is_good", 0);
            cur_frm.set_value("facelec_is_service", 0);
        }
    },
    facelec_is_good: function (frm, cdt, cdn) {
        if (frm.doc.facelec_is_good) {
            cur_frm.set_value("facelec_is_fuel", 0);
            cur_frm.set_value("facelec_is_service", 0);
        }
    },
    facelec_is_service: function (frm, cdt, cdn) {
        if (frm.doc.facelec_is_service) {
            cur_frm.set_value("facelec_is_fuel", 0);
            cur_frm.set_value("facelec_is_good", 0);
        }
    }
});