import GridRow from './grid_row';
import Grid from './grid';







class Custom_GridRow extends GridRow {

	refresh_dependency() {
		if (this.grid_form && this.grid_form.layout) {
			this.grid_form.layout.refresh_dependency();
		}
	}

	validate_columns_width() {
		let total_column_width = 0.0;

		this.selected_columns_for_grid.forEach((row) => {
			if (row.columns && row.columns > 0) {
				total_column_width += cint(row.columns);
			}
		});
	}

	show_form() {
		super.show_form()
		$(this.grid.form_grid).removeClass("relative-important");
	}
	hide_form() {
		super.hide_form()
		$(this.grid.form_grid).addClass("relative-important");
	}
}

class Custom_Grid extends Grid {

	make() {
		let template = `
			<div class="grid-field">
				<label class="control-label">${__(this.df.label || "")}</label>
				<span class="help"></span>
				<p class="text-muted small grid-description"></p>
				<div class="grid-custom-buttons"></div>
				<div class="form-grid-container enhanced-grid-container">
					<div class="form-grid">
						<div class="grid-heading-row"></div>
						<div class="grid-body">
							<div class="rows"></div>
							<div class="grid-empty text-center">
								<img
									src="/assets/frappe/images/ui-states/grid-empty-state.svg"
									alt="Grid Empty State"
									class="grid-empty-illustration"
								>
								${__("No Data")}
							</div>
						</div>
					</div>
					<input type="range" min="1" max="100" value="1" class="enhanced-slider">
				</div>
				<div class="small form-clickable-section grid-footer">
					<div class="flex justify-between">
						<div class="grid-buttons">
							<button type="button" class="btn btn-xs btn-danger grid-remove-rows hidden"
								data-action="delete_rows">
								${__("Delete")}
							</button>
							<button type="button" class="btn btn-xs btn-danger grid-remove-all-rows hidden"
								data-action="delete_all_rows">
								${__("Delete All")}
							</button>
							<button type="button" class="btn btn-xs btn-secondary grid-add-row">
								${__("Add Row")}
							</button>
							<button type="button" class="grid-add-multiple-rows btn btn-xs btn-secondary hidden">
								${__("Add Multiple")}</a>
							</button>
						</div>
						<div class="grid-pagination">
						</div>
						<div class="grid-bulk-actions text-right">
							<button type="button" class="grid-download btn btn-xs btn-secondary hidden">
								${__("Download")}
							</button>
							<button type="button" class="grid-upload btn btn-xs btn-secondary hidden">
								${__("Upload")}
							</button>
						</div>
					</div>
				</div>
			</div>
		`;

		this.wrapper = $(template).appendTo(this.parent);
		$(this.parent).addClass("form-group");
		this.set_grid_description();
		this.set_doc_url();

		frappe.utils.bind_actions_with_object(this.wrapper, this);

		this.form_grid = this.wrapper.find(".form-grid");


		this.form_grid.addClass("relative-important");
		this.form_grid_container = this.wrapper.find(".form-grid-container");
		this.enhanced_slider = this.wrapper.find(".enhanced-slider");
		let me = this
		this.enhanced_slider.on("input", function (event) {
			const value = event.target.value;
			me.form_grid.css("left", `-${value}px`)
		})

		this.setup_trackpad_scroll();

		this.setup_scrollbar_resize_observer();


		this.setup_add_row();

		this.setup_grid_pagination();

		this.custom_buttons = {};
		this.grid_buttons = this.wrapper.find(".grid-buttons");
		this.grid_custom_buttons = this.wrapper.find(".grid-custom-buttons");
		this.remove_rows_button = this.grid_buttons.find(".grid-remove-rows");
		this.remove_all_rows_button = this.grid_buttons.find(".grid-remove-all-rows");

		this.setup_allow_bulk_edit();
		this.setup_check();
		if (this.df.on_setup) {
			this.df.on_setup(this);
		}


	}

	make_head() {
		if (this.prevent_build) return;

		if (this.header_row) {
			$(this.parent).find(".grid-heading-row .grid-row").remove();
		}
		this.header_row = new Custom_GridRow({
			parent: $(this.parent).find(".grid-heading-row"),
			parent_df: this.df,
			docfields: this.docfields,
			frm: this.frm,
			grid: this,
			configure_columns: true,
		});
		this.header_search = new Custom_GridRow({
			parent: $(this.parent).find(".grid-heading-row"),
			parent_df: this.df,
			docfields: this.docfields,
			frm: this.frm,
			grid: this,
			show_search: true,
		});
		this.header_search.row.addClass("filter-row");
		if (this.header_search.show_search || this.header_search.show_search_row()) {
			$(this.parent).find(".grid-heading-row").addClass("with-filter");
		} else {
			$(this.parent).find(".grid-heading-row").removeClass("with-filter");
		}

		this.filter_applied && this.update_search_columns();

		this.setup_scrollable_width();
	}

	render_result_rows($rows, append_row) {
		let result_length = this.grid_pagination.get_result_length();
		let page_index = this.grid_pagination.page_index;
		let page_length = this.grid_pagination.page_length;
		if (!this.grid_rows) {
			return;
		}
		for (var ri = (page_index - 1) * page_length; ri < result_length; ri++) {
			var d = this.data[ri];
			if (!d) {
				return;
			}
			if (d.idx === undefined) {
				d.idx = ri + 1;
			}
			if (d.name === undefined) {
				d.name = "row " + d.idx;
			}
			let grid_row;
			if (this.grid_rows[ri] && !append_row) {
				grid_row = this.grid_rows[ri];
				grid_row.doc = d;
				grid_row.refresh();
			} else {
				grid_row = new Custom_GridRow({
					parent: $rows,
					parent_df: this.df,
					docfields: this.docfields,
					doc: d,
					frm: this.frm,
					grid: this,
				});
				this.grid_rows[ri] = grid_row;
			}

			this.grid_rows_by_docname[d.name] = grid_row;
		}
	}

	setup_visible_columns() {
		if (this.visible_columns && this.visible_columns.length > 0) return;

		this.user_defined_columns = [];
		this.setup_user_defined_columns();
		var total_colsize = 1,
			fields =
				this.user_defined_columns && this.user_defined_columns.length > 0
					? this.user_defined_columns
					: this.editable_fields || this.docfields;

		this.visible_columns = [];

		for (var ci in fields) {
			var _df = fields[ci];

			let df =
			    this.user_defined_columns && this.user_defined_columns.length > 0
			        ? _df
			        : this.fields_map[_df.fieldname];

			if (
				df &&
				!df.hidden &&
				(this.editable_fields || df.in_list_view) &&
				((this.frm && this.frm.get_perm(df.permlevel, "read")) || !this.frm) &&
				!frappe.model.layout_fields.includes(df.fieldtype)
			) {
				if (df.columns) {
					df.colsize = df.columns;
				} else {
					this.update_default_colsize(df);
				}

				if (
					df.fieldtype == "Link" &&
					!df.formatter &&
					df.parent &&
					frappe.meta.docfield_map[df.parent]
				) {
					const docfield = frappe.meta.docfield_map[df.parent][df.fieldname];
					if (docfield && docfield.formatter) {
						df.formatter = docfield.formatter;
					}
				}

				total_colsize += df.colsize;
				if (total_colsize > 100) break;
				this.visible_columns.push([df, df.colsize]);
			}

		}

		var passes = 0;
		while (total_colsize < 11 && passes < 12) {
			for (var i in this.visible_columns) {
				var df = this.visible_columns[i][0];
				var colsize = this.visible_columns[i][1];
				if (colsize > 1 && colsize < 11 && frappe.model.is_non_std_field(df.fieldname)) {
					if (
						passes < 3 &&
						["Int", "Currency", "Float", "Check", "Percent"].indexOf(df.fieldtype) !==
						-1
					) {
						continue;
					}

					this.visible_columns[i][1] += 1;
					total_colsize++;
				}

				if (total_colsize > 10) break;
			}
			passes++;
		}
	}

	setup_trackpad_scroll() {
		const container = this.form_grid_container[0];
		if (!container) return;
		const me = this;

		container.addEventListener(
			"wheel",
			function (e) {
				if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

				if (me.enhanced_slider[0].style.display === "none") return;

				e.preventDefault();

				let delta = e.deltaX;
				if (e.deltaMode === 1) delta *= 16;

				const max = parseFloat(me.enhanced_slider.prop("max")) || 0;
				let current_left = Math.abs(parseFloat(me.form_grid.css("left")) || 0);
				current_left = Math.min(Math.max(current_left + delta, 0), max);

				me.form_grid.css("left", `-${current_left}px`);
				me.enhanced_slider.val(current_left);
			},
			{ passive: false }
		);
	}

	setup_scrollable_width() {
		if (!this.visible_columns || !this.form_grid_container[0]) return;

		const header_row = this.form_grid[0].querySelector(".grid-heading-row .data-row.row");
		if (!header_row) return;

		const containerWidth = this.form_grid_container[0].getBoundingClientRect().width;
		if (!containerWidth) return;

		const row_left = header_row.getBoundingClientRect().left;
		let content_right = row_left;
		for (const col of header_row.children) {
			const col_right = col.getBoundingClientRect().right;
			if (col_right > content_right) content_right = col_right;
		}
		const content_width = content_right - row_left;

		const OVERFLOW_TOLERANCE_PX = 1;

		if (content_width - containerWidth > OVERFLOW_TOLERANCE_PX) {
			const scrollable_distance = Math.ceil(content_width - containerWidth);
			this.enhanced_slider.prop("max", scrollable_distance);
			this.enhanced_slider.prop("style", "display:block");

			let current_left = Math.abs(parseFloat(this.form_grid.css("left")) || 0);
			if (current_left > scrollable_distance) {
				current_left = scrollable_distance;
				this.form_grid.css("left", `-${current_left}px`);
			}
			this.enhanced_slider.val(current_left);

			let thumbPercent = (containerWidth / content_width) * 100;
			thumbPercent = Math.max(thumbPercent, 8);
			this.enhanced_slider[0].style.setProperty("--thumb-width", `${thumbPercent}%`);
		} else {
			this.form_grid.css("left", `0px`)
			this.enhanced_slider.prop("max", containerWidth)
			this.enhanced_slider.prop("style", "display:none")
			this.enhanced_slider.prop("value", 0)
		}
	}

	setup_scrollbar_resize_observer() {
		if (this._scrollbar_resize_observer) {
			this._scrollbar_resize_observer.disconnect();
		}

		if (typeof ResizeObserver !== "undefined") {
			this._scrollbar_resize_observer = new ResizeObserver(() => {
				this.setup_scrollable_width();
			});
			this._scrollbar_resize_observer.observe(this.form_grid_container[0]);
		} else {
			$(window).off("resize.grid_enhancer").on("resize.grid_enhancer", () => {
				this.setup_scrollable_width();
			});
		}
	}

}


frappe.ui.form.ControlTable = class CustomControlTable extends frappe.ui.form.ControlTable {
	make() {
		super.make();

		this.grid = new Custom_Grid({
			frm: this.frm,
			df: this.df,
			parent: this.wrapper,
			control: this,
		});

	}



}































































