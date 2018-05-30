/*	1.1a en-US: Tax Calculation Conversions BEGIN ------------------------------------*/
/*	1.1a es-GT: Calculos y Conversiones de impuestos EMPIEZA -------------------------*/
// Funcion para los calculos necesarios.
function facelec_tax_calc_new(frm, cdt, cdn) {
    // es-GT: Actualiza los datos en los campos de la tabla hija 'items'
    refresh_field('items');

    // es-GT: Se asigna a la variable el valor que encuentre en la fila 0 de la tabla hija taxes
    this_company_sales_tax_var = cur_frm.doc.taxes[0].rate;

	// es-GT: Ahora se hace con un event listener al primer teclazo del campo de cliente
	// es-GT: Sin embargo queda aqui para asegurar que el valor sea el correcto en todo momento.
    //console.log("If you can see this, tax rate variable now exists, and its set to: " + this_company_sales_tax_var);
	console.log("Ran the new tax calc function!");
    var this_row_qty, this_row_rate, this_row_amount, this_row_conversion_factor, this_row_stock_qty, this_row_tax_rate, this_row_tax_amount, this_row_taxable_amount;

    // es-GT: Esta funcion permite trabajar linea por linea de la tabla hija items
	//OJO!  Queda pendiente trabajar la forma de que el control o pop up que contiene estos datos, a la hora de cambiar conversion factor, funcione adecuadamente! FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
    frm.doc.items.forEach((item_row, index) => {
        if (item_row.name == cdn) {
			// first we calculate the amount total for this row and assign it to a variable
            this_row_amount = (item_row.qty * item_row.rate);
			// Now, we get the quantity in terms of stock quantity by multiplying by conversion factor
			//OLD Method
            //this_row_stock_qty = (item_row.qty * item_row.conversion_factor);
			// NEW Method
			this_row_stock_qty = item_row.stock_qty
			// We then assign the tax rate per stock UOM to a variable
            this_row_tax_rate = (item_row.facelec_tax_rate_per_uom);
			// We calculate the total amount of excise or special tax based on the stock quantity and tax rate per uom variables above.
			//OLD METHOD
            //this_row_tax_amount = (this_row_stock_qty * this_row_tax_rate);
			//NEW Method
			this_row_tax_amount = (item_row.stock_qty * item_row.facelec_tax_rate_per_uom);
			// We then estimate the remainder taxable amount for which Other ERPNext configured taxes will apply.
            this_row_taxable_amount = (this_row_amount - this_row_tax_amount);
			// We change the fields for other tax amount as per the complete row taxable amount.
			// Old version, uncomment in case items do not work properly.
			//frm.doc.items[index].facelec_other_tax_amount = ((item_row.facelec_tax_rate_per_uom * (item_row.qty * item_row.conversion_factor)));
			frm.doc.items[index].facelec_other_tax_amount = this_row_taxable_amount;
			//OJO!  No se puede utilizar stock_qty en los calculos, debe de ser qty a puro tubo!
			// Old version, uncomment in case items do not work properly.
			//frm.doc.items[index].facelec_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - ((item_row.qty * item_row.conversion_factor) * item_row.facelec_tax_rate_per_uom));
			//OLD 2
			//frm.doc.items[index].facelec_amount_minus_excise_tax = this_row_taxable_amount;
			// NEW
			console.log("new calulation")
			frm.refresh_field("items")
			frm.doc.items[index].facelec_amount_minus_excise_tax = ((item_row.qty * item_row.rate) - (item_row.stock_qty * item_row.facelec_tax_rate_per_uom));
            console.log("uom that just changed is: " + item_row.uom);
            console.log("stock qty is: " + item_row.stock_qty); // se queda con el numero anterior.  multiplicar por conversion factor (si existiera!)
            // Por alguna razón esta multiplicando y obteniendo valores negativos  FIXME
			// absoluto? FIXME
			// Que sucedera con una nota de crédito? FIXME
			// Absoluto y luego NEGATIVIZADO!? FIXME
			// Any way to run the function TWICE?
            console.log("conversion_factor is: " + item_row.conversion_factor);

            // Verificacion Individual para verificar si es Fuel, Good o Service
            if (item_row.factelecis_fuel == 1) {
                //console.log("The item you added is FUEL!" + item_row.facelec_is_good);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (1 + (this_company_sales_tax_var / 100))).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_fuel_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_fuel_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_fuel_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check combustibles
                total_fuel = 0;
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
            if (item_row.facelec_is_good == 1) {
                //console.log("The item you added is a GOOD!" + item_row.facelec_is_good);// WORKS OK!
                //console.log("El valor en bienes para el libro de compras es: " + net_goods_tally);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (this_company_sales_tax_var / 100)).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_goods_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_goods_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_goods_amt * (this_company_sales_tax_var / 100));
                // Sumatoria de todos los que tengan el check bienes
                total_goods = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    // total_qty += flt(d.qty);
                    if (d.facelec_is_good == true) {
                        total_goods += flt(d.facelec_gt_tax_net_goods_amt);
                    };
                });
                //console.log("El total neto de bienes es:" + total_goods);// WORKS OK!
                frm.doc.facelec_gt_tax_goods = total_goods;
            };
            if (item_row.facelec_is_service == 1) {
                //console.log("The item you added is a SERVICE!" + item_row.facelec_is_service);// WORKS OK!
                //console.log("El valor en servicios para el libro de compras es: " + net_services_tally);// WORKS OK!
                // Estimamos el valor del IVA para esta linea
                //frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_amount_minus_excise_tax * (this_company_sales_tax_var / 100)).toFixed(2);
                //frm.doc.items[index].facelec_gt_tax_net_services_amt = (item_row.facelec_amount_minus_excise_tax - item_row.facelec_sales_tax_for_this_row).toFixed(2);
                frm.doc.items[index].facelec_gt_tax_net_services_amt = (item_row.facelec_amount_minus_excise_tax / (1 + (this_company_sales_tax_var / 100)));
                frm.doc.items[index].facelec_sales_tax_for_this_row = (item_row.facelec_gt_tax_net_services_amt * (this_company_sales_tax_var / 100));

                total_servi = 0;
                $.each(frm.doc.items || [], function (i, d) {
                    if (d.facelec_is_service == true) {
                        total_servi += flt(d.facelec_gt_tax_net_services_amt);
                    };
                });
                // console.log("El total neto de servicios es:" + total_servi); // WORKS OK!
                frm.doc.facelec_gt_tax_services = total_servi;
            };

            // Para el calculo total de IVA, basado en la sumatoria de facelec_sales_tax_for_this_row de cada item
            full_tax_iva = 0;
            $.each(frm.doc.items || [], function (i, d) {
                full_tax_iva += flt(d.facelec_sales_tax_for_this_row);
            });
            frm.doc.facelec_total_iva = full_tax_iva;
        };
    });
}
/*	1.1a en-US: Tax Calculation Conversions END --------------------------------------*/
/*	1.1a es-GT: Calculos y Conversiones de impuestos TERMINA -------------------------*/