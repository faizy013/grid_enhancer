## Grid Enhancer

Enhanced and customizable grid views for Frappe Framework with improved usability, controls, and productivity features.

### Features

- Improved child table scrolling behavior (horizontal + trackpad support)
- Sidebar view for easier navigation within grids
- Better handling of wide/overflowing child tables
- Drop-in enhancement — no changes needed to existing DocTypes

### Screenshots

**Scrolled to the right**
![Child table scrolled right](public/images/child_table_scrolled_right.png)

**Sidebar view**
![Child table sidebar](public/images/child_table_sidebar.png)

**Trackpad scroll behavior**
![Child table trackpad scroll](public/images/child_table_trackpad_scroll.png)

### Installation

```bash
cd frappe-bench
bench get-app grid_enhancerhttps://github.com/faizy013/grid_enhancer.gi
bench --site <your-site> install-app grid_enhancer
bench --site <your-site> migrate
```

### Usage

Once installed, Grid Enhancer automatically applies to child table grid views across the site — no additional configuration required.

#### License

mit