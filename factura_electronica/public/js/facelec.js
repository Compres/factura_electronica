console.log("Se cargo exitosamente la aplicación de Factura Electrónica");
/* 1 --------------------------------------------------------------------------------------------------------------- */
/**
 * Funcionamiento: Valida que el Nit sea C/F o un numero de nit valido permitiendo
 * activar la opcion para guardar. Si el nit es invalido desactiva la funcion
 * guardar hasta que se ingrese uno correcto, esto permite no tener errores con
 * INFILE y tener los datos correctos.
 */

function  calcularDigitoVerificacion ( myNit )  {
    var vpri,
        x,
        y,
        z;
    
    // Se limpia el Nit
    myNit = myNit.replace ( /\s/g, "" ) ; // Espacios
    myNit = myNit.replace ( /,/g,  "" ) ; // Comas
    myNit = myNit.replace ( /\./g, "" ) ; // Puntos
    myNit = myNit.replace ( /-/g,  "" ) ; // Guiones
    
    // Se valida el nit
    if  ( isNaN ( myNit ) )  {
      console.log ("El nit/cédula '" + myNit + "' no es válido(a).") ;
      return "" ;
    };
    
    // Procedimiento
    vpri = new Array(16) ; 
    z = myNit.length ;
  
    vpri[1]  =  3 ;
    vpri[2]  =  7 ;
    vpri[3]  = 13 ; 
    vpri[4]  = 17 ;
    vpri[5]  = 19 ;
    vpri[6]  = 23 ;
    vpri[7]  = 29 ;
    vpri[8]  = 37 ;
    vpri[9]  = 41 ;
    vpri[10] = 43 ;
    vpri[11] = 47 ;  
    vpri[12] = 53 ;  
    vpri[13] = 59 ; 
    vpri[14] = 67 ; 
    vpri[15] = 71 ;
  
    x = 0 ;
    y = 0 ;
    for  ( var i = 0; i < z; i++ )  { 
      y = ( myNit.substr (i, 1 ) ) ;
      // console.log ( y + "x" + vpri[z-i] + ":" ) ;
  
      x += ( y * vpri [z-i] ) ;
      // console.log ( x ) ;    
    }
  
    y = x % 11 ;
    // console.log ( y ) ;
  
    return ( y > 1 ) ? 11 - y : y ;
  }


export function valNit(nit, cus_supp, frm) {
    var nit_validado;
    if (nit === "C/F" || nit === "c/f") {
        frm.enable_save(); // Activa y Muestra el boton guardar de Sales Invoice
    } else {
        var nd="", add = 0;
        if (nd !=calcularDigitoVerificacion.exec(nit)) {
            nd[2] = (nd[2].toLowerCase() == 'k') ? 10 : parseInt(nd[2]);
            for (var i = 0; i < nd[1].length; i++) {
                add += ((((i - nd[1].length) * -1) + 1) * nd[1][i]);
            }
            nit_validado = ((11 - (add % 11)) % 11) == nd[2];
        } else {
            nit_validado = false;
        }

        if (nit_validado === false) {
            frappe.show_alert({
                indicator: 'orange',
                message: __(`
                NIT de <a href= '#Form/Customer/${cus_supp}'><b>${cus_supp}</b></a> no es correcto. Si no tiene disponible el NIT modifiquelo a C/F.
                `)
            });

            frm.disable_save(); // Desactiva y Oculta el boton de guardar en Sales Invoice
        }
        if (nit_validado === true) {
            frm.enable_save(); // Activa y Muestra el boton guardar de Sales Invoice
        }
    }
}

/* ----------------------------------------------------------------------------------------------------------------- */
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

// Validador NIT para customer
frappe.ui.form.on("Customer", {
    nit_face_customer: function (frm) {
        valNit(frm.doc.nit_face_customer, frm.doc.name, frm);
        frm.set_value('tax_id', frm.doc.nit_face_customer);
    },
    tax_id: function (frm) {
        valNit(frm.doc.tax_id, frm.doc.name, frm);
        frm.set_value('nit_face_customer', frm.doc.tax_id);
    }
});
// Validador NIT para Supplier
frappe.ui.form.on("Supplier", {
    facelec_nit_proveedor: function (frm) {
        valNit(frm.doc.facelec_nit_proveedor, frm.doc.name, frm);
        frm.set_value('tax_id', frm.doc.facelec_nit_proveedor);
    },
    tax_id: function (frm) {
        valNit(frm.doc.tax_id, frm.doc.name, frm);
        frm.set_value('facelec_nit_proveedor', frm.doc.tax_id);
    }
});

frappe.ui.form.on("Company", {
    nit_face_company: function (frm) {
        // valNit(frm.doc.nit_face_company, frm.doc.name, frm);
        frm.set_value('tax_id', frm.doc.nit_face_company);
    },
    tax_id: function (frm) {
        // valNit(frm.doc.tax_id, frm.doc.name, frm);
        frm.set_value('nit_face_company', frm.doc.tax_id);
    },
    setup: function (frm) {
    frm.set_query('isr_account_payable', 'tax_witholding_ranges', () => {
      return {
        filters: {
          company: frm.doc.name
        }
      }
    });
    frm.set_query('isr_account_receivable', 'tax_witholding_ranges', () => {
      return {
        filters: {
          company: frm.doc.name
        }
      }
    });
    frm.set_query('iva_account_payable', 'tax_witholding_ranges', () => {
      return {
        filters: {
          company: frm.doc.name
        }
      }
    });
    frm.set_query('vat_account_receivable', 'tax_witholding_ranges', () => {
      return {
        filters: {
          company: frm.doc.name
        }
      }
    });
    cur_frm.refresh_field('report_list');
  },
});
/* en-US: INDIVIDUAL SOURCE CODE FROM .js FILES IN THIS DIRECTORY WILL BE ADDED WHEN DOING A BENCH BUILD
   es-GT: CODIGO FUENTE INDIVIDUAL DE ARCHIVOS .js EN ESTE DIRECTORIO SE AGREGARAN ABAJO AL HACER BENCH BUILD */

// ================================================================================================================ //

// descripciones campos address
frappe.ui.form.on("Address", {
    refresh: function (frm) {
        frm.set_df_property("city", "description", __("<b>FEL: Departamento</b>"));
        frm.set_df_property("state", "description", __("<b>FEL: Municipio</b>"));
        frm.set_df_property("address_line1", "description", __(
            "<b>FEL: Direccion Comercial 1</b>"));
        frm.set_df_property("country", "description", __("<b>FEL: Pais</b>"));
        frm.set_df_property("email_id", "description", __("<b>FEL: Correo Electronico</b>"));
        frm.set_df_property("pincode", "description", __("<b>FEL: Código Postal</b>"));
        frm.set_df_property("is_primary_address", "description", __(
            "<b>FEL: Dirección para facturar</b>"));
    }
});