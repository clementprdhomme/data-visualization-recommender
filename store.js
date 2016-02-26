/* The store is like a model. It's where all the app data is saved. Thanks to
 * the reactivity of Vue, each value can be binded to the DOM (two-way
 * binding) or updated whenever another one is updated. */
var store = {
  /* The url of the JSON dataset */
  url: '',
  /* Eventually an error object from the XMLHttpRequest */
  error: null,
  /* The whole dataset */
  data: {},
  /* Fields refers to the columns, it contains:
   *  - {String}  name: their names
   *  - {String}  type: their data types
   *  - {String}  statType: their statistical data types
   *  - {Boolean} enabled: if the field is disabled depending on the graph type
   */
  fields: [],
  /* The statistical types associated with their number of occurences accross
   * the columns */
  statTypesCount: {},
  /* All the type of charts that are taken into account by the algorithm. Each
   * of them contains:
   *  - {String}  name: the name of the chart
   *  - {Boolean} enabled: if the type of chart is available depending on the
   *                       dataset
   *  - {Array}   acceptedStatTypes: a list of one-dimension or two-dimension
   *                                 arrays indicating the statistical types
   *                                 accepted by the chart. If one of the
   *                                 element has just one value, it means that
   *                                 the graph is computed with only one column,
   *                                 otherwise, it means that it needs two
   *                                 columns (with the specified statistical
   *                                 types). */
  charts: {
    bar: {
      name: 'Bar chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.n ],
        [ STATTYPE.o ],
        [ STATTYPE.q, STATTYPE.n ],
        [ STATTYPE.q, STATTYPE.t ],
        [ STATTYPE.q, STATTYPE.o ]
      ]
    },
    line: {
      name: 'Line chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.q, STATTYPE.t ],
        [ STATTYPE.q, STATTYPE.o ]
      ]
    },
    pie: {
      name: 'Pie chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.n ],
        [ STATTYPE.o ],
      ]
    },
    point: {
      name: 'Scatter chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.q, STATTYPE.q ],
        [ STATTYPE.n, STATTYPE.n ],
        [ STATTYPE.n, STATTYPE.o ],
        [ STATTYPE.o, STATTYPE.o ]
      ]
    },
    point_1d: {
      name: 'One-dimension scatter chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.q ],
        [ STATTYPE.t ],
      ]
    },
    tick: {
      name: 'Tick chart',
      enabled: false,
      acceptedStatTypes: []
    },
    tick_1d: {
      name: 'One-dimension tick chart',
      enabled: false,
      acceptedStatTypes: [
        [ STATTYPE.q ],
        [ STATTYPE.t ],
      ]
    }
  },
  /* The selected chart (object) */
  selectedChart:  null,
  /* The two selected fields (columns) */
  firstColumnField:  null,
  secondColumnField: null,
  /* Indicate that the inferring of the chart type is finished */
  chartInferringDone: false
  /* Available fields for the second columns (computed property)
  secondColumnAvailableFields */
};
