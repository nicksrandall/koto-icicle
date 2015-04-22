AutoWidgets.register({
  name: 'Icicle',
  data: [{
      name: 'model',
      columnNames: [{
        name: 'Name',
        type: 'string',
        validation: function (row) { return row[0] === 'Moderate';}
      }, {
        name: 'Col1',
        type: 'string'
        // validation: function () {}
      }, {
        name: 'Col2',
        type: 'string'
        // validation: function () {}
      }, {
        name: 'col3',
        type: 'string'
        // validation: function () {}
      }, {
        name: 'col4',
        type: 'string'
        // validation: function () {}
      }, {
        name: 'col5',
        type: 'string'
        // validation: function () {}
      }, {
        name: 'col6',
        type: 'string'
        // validation: function () {}
      }],
      defaultValues: [
        ['Moderate','Cash',0.03],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','SAGYX',0.05],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','MGK',0.04],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','GILD',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','PRU',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','DLTR',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Growth','BX',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','HLIEX',0.05],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','XLP',0.04],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','LEN',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','AET',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','FDX',0.01],
        ['Moderate','Equities','Domestic Equities','Large Cap','Large Cap Value','STZ',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Growth','PYSAX',0.04],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Growth','ALK',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Growth','ARRS',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Growth','GT',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Growth','ONNN',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Value','JVMIX',0.05],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Value','URI',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Value','EV',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Value','PLT',0.01],
        ['Moderate','Equities','Domestic Equities','Mid Cap','Mid Cap Value','SKX',0.01],
        ['Moderate','Equities','Domestic Equities','Small Cap','Small Cap Value','UBVSX',0.02],
        ['Moderate','Equities','International Equities','Developed','Large Cap','CAEEX',0.03],
        ['Moderate','Equities','International Equities','Developed','Large Cap','OIGYX',0.03],
        ['Moderate','Equities','International Equities','Developed','Large Cap','MINIX',0.03],
        ['Moderate','Equities','International Equities','Developed','Large Cap','LCOIX',0.02],
        ['Moderate','Equities','International Equities','Developed','Large Cap','PTR',0.01],
        ['Moderate','Equities','International Equities','Developed','Mid Cap','NE',0.01],
        ['Moderate','Equities','International Equities','Developed','Mid Cap','LAZ',0.01],
        ['Moderate','Equities','International Equities','Emerging Mkt','EMIYX',0.01],
        ['Moderate','Equities','International Equities','Emerging Mkt','VWO',0.01],
        ['Moderate','Equities','Equity Alt','LFMIX',0.01, null, null],
        ['Moderate','Equities','Equity Alt','AQMIX',0.01, null, null],
        ['Moderate','Fixed Income','Domestic','High Yield','JYIIX',0.04],
        ['Moderate','Fixed Income','Domestic','Private Debt','KKR',0.06],
        ['Moderate','Fixed Income','Domestic','Unconstrained','GSZIX',0.02],
        ['Moderate','Fixed Income','Domestic','Unconstrained','PDVYX',0.04],
        ['Moderate','Fixed Income','International','DIBRX',0.02],
        ['Moderate','Fixed Income','Fixed Income Alts','Real Estate','CSG',0.01],
        ['Moderate','Fixed Income','Fixed Income Alts','MLPs','GMLPX',0.01]
      ]
  }]
});












