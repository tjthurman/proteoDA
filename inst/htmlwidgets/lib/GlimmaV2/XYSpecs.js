
// parametrise graph encoding for MDS plot
function createXYSpec(xyData, xyTable, width, height)
{

  var tooltip = makeVegaTooltip(xyData.cols);

  // if an annotation is given, search for a symbol column (case insensitive)
  // TODO: COULD THIS BE REMOVED?
  if (xyData.annoCols != -1) {
    var symbolIndex = xyData.annoCols.map(x => x.toLowerCase()).indexOf("symbol");
    var symbolField = symbolIndex >= 0 ? xyData.annoCols[symbolIndex] : "symbol";
  }

  return {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "Testing ground for GlimmaV2",
    "width": xyData.counts == -1 ? (width*0.9) : (width * 0.5),
    "height": height * 0.35,
    "padding": {"left": 0, "top": 0, "right": 0, "bottom": 10},
    "autosize": {"type": "fit", "resize": true},
    "title": {
      "text": xyData.title // TODO: Could remove?? or do plot type?
    },
    "signals":
      [
        {
          "name": "click", "value": null,
          "on": [ {"events": "mousedown", "update": "[datum, now()]" } ]
        },
        {
          "name": "x_axis",
          "value": "logFC",
          "on": [
            {
             "events": [
                {"signal": "pval_type"},
                {"signal": "plot_type"}
                ],
              "update": "(plot_type == \"MD\" ? \"AveExpr\" : \"logFC\")"
            }
          ]
        },
        {
          "name": "x_axis_title",
          "value": "log2 fold-change (logFC)",
          "on": [
            {
             "events": [
                {"signal": "pval_type"},
                {"signal": "plot_type"}
                ],
              "update": "(plot_type == \"MD\" ? \"average intensity\" : \"log2 fold-change (logFC)\")"
            }
          ]
        },
        {
          "name": "y_axis",
          "value": "negLog10adjP",
           "on": [
            {
              "events": [
                {"signal": "pval_type"},
                {"signal": "plot_type"}
                ],
              "update": "(plot_type == \"MD\" ? \"logFC\" : (pval_type == \"raw\" ? \"negLog10rawP\" : \"negLog10adjP\"))"
            }
            ]
        },
                {
          "name": "y_axis_title",
          "value": "-log10(adjusted P)",
           "on": [
            {
              "events": [
                {"signal": "pval_type"},
                {"signal": "plot_type"}
                ],
              "update": "(plot_type == \"MD\" ? \"log2 fold-change (logFC)\" : (pval_type == \"raw\" ? \"-log10(raw P)\" : \"-log10(adjusted P)\"))"
            }
            ]
        },
        {
          "name": "point_color",
          "value": "sig.FDR.fct",
           "on": [
            {
              "events": [
                {"signal": "pval_type"},
                {"signal": "plot_type"}
                ],
              "update": "(pval_type == \"raw\" ? \"sig.pval.fct\" : \"sig.FDR.fct\")"
            }
            ]
        },
        {
          "name": "plot_type",
          "value": "volcano",
          "bind": {
            "input": "select",
            "options": ["volcano", "MD"],
            "name": "Plot type: ",
            "style": "width: 200px; margin-bottom: 10px;"
          }
        },
        {
          "name": "pval_type",
          "value": "adjusted",
          "bind": {
            "input": "select",
            "options": ["raw", "adjusted"],
            "name": "P-value type: ",
            "style": "width: 200px; margin-bottom: 10px;"
          }
        }
      ],
    "data":
      [
        {
          "name": "source",
          "values": xyTable,
          "transform": [{
            "type": "formula",
            "expr": "datum.x",
            "as": "tooltip"
          }]
        },
        { "name": "selected_points" }
      ],
    "scales": [
      {
        "name": "x",
        "type": "linear",
        "round": true,
        "nice": true,
        "zero": false,
        "domain": { "data": "source", "field": {"signal" : "x_axis"}},
        "range": "width"
      },
      {
        "name": "y",
        "type": "linear",
        "round": true,
        "nice": true,
        "zero": false,
        "domain": {
          "data": "source",
          "field": {"signal" : "y_axis"}
        },
        "range": "height"
      },
      {
        "name": "colour_scale",
        "type": "ordinal",
        // co-ordinate w/ domain of status
        "domain": ["downReg", "nonDE", "upReg"],
        "range": xyData.statusColours
      }
    ],
    "legends": [
      {
        "fill": "colour_scale",
        "title": "Status",
        "symbolStrokeColor": "black",
        "symbolStrokeWidth": 1,
        "symbolOpacity": 0.7,
        "symbolType": "circle"
      }
    ],
    "axes" : [
      {
        "scale": "x",
        "grid": true,
        "domain": false,
        "orient": "bottom",
        "tickCount": 5,
        "title": {"signal" : "x_axis_title"}
      },
      {
        "scale": "y",
        "grid": true,
        "domain": false,
        "orient": "left",
        "titlePadding": 5,
        "title": {"signal" : "y_axis_title"}
      }
    ],
    "marks": [
      {
        "name": "marks",
        "type": "symbol",
        "from": { "data": "source" },
        "encode": {
          "update": {
            "x": { "scale": "x", "field": {"signal" : "x_axis"} },
            "y": {
              "scale": "y",
              "field": {"signal" : "y_axis"}
            },
            "shape": "circle",
            "size" : [ {"test": "datum.status == 0", "value": 5}, {"value": 25} ],
            "opacity": {"value": 0.65},
            "fill": { "scale": "colour_scale", "field": {"signal": "point_color"} },
            "strokeWidth": {"value": 1},
            "stroke": {"value": "transparent"},
            "tooltip": tooltip
          }
        }
      },
      // overlaying selected points
      {
        "name": "selected_marks",
        "type": "symbol",
        "from": { "data": "selected_points" },
        "encode": {
          "update": {
            "x": { "scale": "x", "field": {"signal" : "x_axis"}},
            "y": {
              "scale": "y",
              "field": {"signal" : "y_axis"}
            },
            "shape": "circle",
            "size": {"value": 120},
            "fill": { "scale": "colour_scale", "field":  {"signal": "point_color"}  },
            "strokeWidth": { "value": 1 },
            "stroke": { "value": "black" },
            "opacity": { "value": 1 },
            "tooltip": tooltip
          }
        }
      },
      // symbol text
      {
        "name": "selected_text",
        "type": "text",
        "from": { "data": "selected_points" },
        "encode": {
          "update": {
            "x": { "scale": "x", "field": {"signal" : "x_axis"} },
            "y": {
              "scale": "y",
              "field": {"signal" : "y_axis"},
              "offset": -10
            },
            "fill": { "value": "black" },
            "fontWeight": {"value": "bold"},
            "opacity": { "value": 1 },
            "text": {"field": xyData.annoCols == -1 ? "symbol" : symbolField },
            "fontSize": {"value": 12}
          }
        }
      }
    ]
  };
}
