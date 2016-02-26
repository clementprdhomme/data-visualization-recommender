new Vue({
  el: '#app',

  data: window.store,

  /* Contain all the methods which will be executed whenever a store's variable
   * matching their names is updated */
  watch: {

    /* Output the XMLHttpRequest error whenever it appears */
    error: function() {
      if(this.error) console.error(this.error);
    },

    /* Reset the two column fields selection and compute their available options
     * when the selected chart is changed */
    selectedChart: function() {
      this.firstColumnField = null;
      this.secondColumnField = null;
      this.computeAvailableFields();
    },

    /* Reset the selection of the second column field whenever the first one's
     * value is updated (to prevent having an unavailable field activated) */
    firstColumnField: function() {
      this.secondColumnField = null;
    },

    /* If the second field has just one option, we selece it by default */
    secondColumnAvailableFields: function() {
      if(this.firstColumnField &&
        this.secondColumnAvailableFields.length === 1) {
        this.secondColumnField = this.secondColumnAvailableFields[0];
      }
    }

  },

  /* Contain all the store properties which will be computed each time one of
   * their dependent store's attributes are updated */
  computed: {

    secondColumnAvailableFields: function() {
      /* Fields which are not filtered out for the first column */
      var availableFields = this.fields.filter(function(field) {
        return field.enabled;
      });

      if(!this.firstColumnField) return availableFields;

      /* Statistical types compatible with the chart belonging to a couple where
       * the first column's one is present */
      var availableStatTypes = this.selectedChart.acceptedStatTypes.filter(function(arrStatType) {
        return arrStatType.length === 2 && (
          arrStatType[0] === this.firstColumnField.statType ||
          arrStatType[1] === this.firstColumnField.statType);
      }.bind(this)).reduce(function(res, statTypesCouple) {
        if(statTypesCouple[0] === this.firstColumnField.statType) {
          res.push(statTypesCouple[1]);
        } else {
          res.push(statTypesCouple[0]);
        }

        return res;
      }.bind(this), []);

      var res = availableFields.filter(function(field) {
        return ~availableStatTypes.indexOf(field.statType) &&
          field !== this.firstColumnField;
      }.bind(this));

      return res;
    }

  },

  methods: {

    /* Main method */
    computeRecommendations: function() {
      $get(this.url, function(data) {
        /* Each time a new dataset is proposed, we reset the app's state */
        this.data = data;
        this.fields = [];
        this.selectedChart  = null;
        this.firstColumnField = null;
        this.secondColumnField = null;

        var typeInference = dl.type.inferAll(this.data);
        for(var field in typeInference) {
          this.fields.push({
            name: field,
            enabled: false,
            type: typeInference[field],
            statType: this.computeStatType(field, typeInference[field])
          });
        }

        this.computeStatTypesCount();
        this.computeAvailableCharts();

        this.chartInferringDone = true;
      }.bind(this));
    },

    /* Return the statistical type of the field called fieldName and whose type
     * is fieldType */
    computeStatType: function(fieldName, fieldType) {
      var statType;

      switch(fieldType) {

        case 'number':
        case 'integer':
          statType = (this.computeDistinctValuesCount(fieldName) <= 5) ?
            STATTYPE.o : STATTYPE.q;
          break;

        case 'date':
          statType = STATTYPE.t;
          break;

        case 'boolean':
        case 'string':
          statType = STATTYPE.n;
          break;

      }

      return statType;
    },

    /* Return the number of distinct values within the column called
     * fieldName */
    computeDistinctValuesCount: function(fieldName) {
      var columnData = this.data.reduce(function(res, row) {
        res.push(row[fieldName]);
        return res;
      }, []);

      return dl.count.distinct(columnData);
    },

    /* Compute the number of each statistical types among the columns/fields and
     * store it inside this.statTypesCount */
    computeStatTypesCount: function() {
      var statTypes = [ STATTYPE.o, STATTYPE.q, STATTYPE.n, STATTYPE.t ];

      for(var i = 0, j = statTypes.length; i < j; i++) {
        this.statTypesCount[statTypes[i]] = this.fields.filter(function(field) {
          return field.statType === statTypes[i];
        }).length;
      }
    },

    /* Update the "enabled" field of each chart depending on if it can be
     * rendered with the dataset */
    computeAvailableCharts: function() {
      for(var chart in this.charts) {
        for(var i = 0, j = this.charts[chart].acceptedStatTypes.length;
          i < j; i++) {

          var acceptedCombinations = this.charts[chart].acceptedStatTypes[i];

          this.charts[chart].enabled = false ||

            /* One lonely statistical type is present */
            acceptedCombinations.length === 1 &&
            this.statTypesCount[acceptedCombinations[0]] >= 1 ||

            /*  Two fields, which are different and are present */
            acceptedCombinations.length === 2 &&
            acceptedCombinations[0] !== acceptedCombinations[1] &&
            this.statTypesCount[acceptedCombinations[0]] >= 1 &&
            this.statTypesCount[acceptedCombinations[1]] >= 1 ||

            /* Two fields, which are the same and are present */
            acceptedCombinations.length === 2 &&
            acceptedCombinations[0] === acceptedCombinations[1] &&
            this.statTypesCount[acceptedCombinations[0]] >= 2;

          if(this.charts[chart].enabled) break;

        }
      }
    },

    /* Compute the fields that are available depending on the chart chosen by
     * the user and its statistical types acceptance */
    computeAvailableFields: function() {
      var field;
      for(var i = 0, j = this.fields.length; i < j; i++) {
        field = this.fields[i];

        this.fields[i].enabled = true &&

          /* A chart is selected */
          this.selectedChart && (

          /* The field's statistical type can be used to generate the chart by
           * its own */
          !!~this.selectedChart.acceptedStatTypes.filter(function(arr) {
            return arr.length === 1;
          }).map(function(arr) {
            return arr[0];
          }).indexOf(field.statType) ||

          /* The field's statistical type can be used with another one
           * (different) which is present among the other fields */
          this.selectedChart.acceptedStatTypes.filter(function(arr) {
            /* We retrieve all the couples of statistical types where the two
             * are different the one from the other and where one of them is
             * equal to the current field's one */
            return arr.length === 2 &&
              (arr[0] === field.statType ||
              arr[1] === field.statType) &&
              arr[0] !== arr[1];
          }).map(function(arr) {
            /* We retrieve all the couples where one of the statistical types
             * is the one of the current field, and the other one is present
             * among the other fields */
            return arr[0] === field.statType &&
              this.statTypesCount[arr[1]] >= 1 ||
              arr[1] === field.statType &&
              this.statTypesCount[arr[0]] >= 1;
          }.bind(this)).length > 0 ||

          /* The field's statistical type can be used twice */
          this.selectedChart.acceptedStatTypes.filter(function(arr) {
            /* We retrieve all the couples of statistical types where the two
             * are the same one and where one of them is equal to the current
             * field's one */
            return arr.length === 2 &&
              arr[0] === field.statType &&
              arr[0] === arr[1];
          }).length >= 1 &&
          this.statTypesCount[field.statType] >= 2);
      }

      /* In case just one field is enabled, we select it by default */
      var enabledFields = this.fields.filter(function(field) {
        return field.enabled;
      });

      if(enabledFields.length === 1) {
        this.firstColumnField = enabledFields[0];
      }
    }

  }
});
