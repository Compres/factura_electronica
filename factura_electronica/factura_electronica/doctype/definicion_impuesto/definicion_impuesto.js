// Copyright (c) 2020, Frappe and contributors
// For license information, please see license.txt

frappe.ui.form.on('Definicion Impuesto', {
	// refresh: function(frm) {

	// }
	attendee: function(frm, cdt, cdn) {
	var attendee = frappe.model.get_doc(cdt, cdn);
	debugger;
	console.log(attendee);
	}
});

frappe.ui.form.on("Definicion Impuesto", "refresh", function(frm) {
	if(!frm.doc.is_folder) {
		frm.add_custom_button(__('Download'), function() {
			var file_url = frm.doc.file_url;
			if (frm.doc.file_name) {
				file_url = file_url.replace(/#/g, '%23');
			}
			window.open(file_url);
		}, "fa fa-download");
	}
});