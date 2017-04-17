var https = require('https')

var response = {
    uid: 'urn:uuid:6efe5726-f11c-4c61-aaaa-d4aa9886a987',
    updateDate:  (new Date()).toISOString(),
    titleText: 'Is Trump At Mar-a-Lago?',
    redirectionUrl: 'https://istrumpatmaralago.org/',
    mainText: ''
}

var url = 'https://sheets.googleapis.com/v4/spreadsheets/1JWfwoJ5uSSxYry0AwGg3oc4FPsprIjWWVKWrFn-KqyE/values:batchGet?' +
    'ranges=whereuat&ranges=trips&ranges=alternatives&key=AIzaSyB-Gb6hsgnEaZhE6wGoNIBM2BOumgHqFDQ'

var getAlexaResponse = (callback) => {
    var req = https.get(url, (res) => {
        var chunks = []

        res.on('data', (chunk) => {
            chunks.push(chunk)
        })

        res.on('end', () => {
            var body = chunks.join('')
            var data = JSON.parse(body)

            response.mainText = createMainText(data)

            //console.log(price)
            callback(null, response)
        })
    })

    req.on('error', (e) => {
        console.error(e);

        response.mainText = createStaticText()
        callback(null, defaultStatus);
    })
}

function createMainText(data) {
    var whereaut = data.valueRanges[0].values[1]
    var inMaralago = whereaut[0].toLowerCase() === "yes"

    var trips = data.valueRanges[1].values
    var noOfTrips = trips.length - 1
    var totalCost = noOfTrips * 3.6;

    var noOfWeekends = figureOutWeekends()

    var alternatives = data.valueRanges[2].values;
    var alt = alternatives[randomInt(1, alternatives.length -1)]
    var altUnitCost = parseInt( alt[2].replace('$', ''))
    var altNo = Math.floor(totalCost * 10000000 / altUnitCost)
    var altDesc = alt[1].toLowerCase();
    var altName = alt[0].toLowerCase()

    var mainText = [
        'President Trump',
        inMaralago ? 'is ' : 'is not',
        'in Mar A Lago.',
        'But he\'s gone ' + noOfTrips + ' weekends out of ' + noOfWeekends + ' as President.',
        'Total spent on trips to Mar A Lago is ' + totalCost + ' million dollars.',
        'Counting ' + altName + ', this is equivalent to ' + altNo + ' of ' + altDesc + '.'
    ].join(' ')

    return mainText
}

function createStaticText() {
    var inMaralago = false

    var noOfTrips = 7
    var totalCost = noOfTrips * 3.6;

    var noOfWeekends = figureOutWeekends()

    var altUnitCost = 2765
    var altNo = totalCost * 1000000 / altUnitCost
    var altName = "meals on wheels";
    var altDesc = "meals on wheels recipients"

    var mainText = [
        'President Trump',
        inMaralago ? 'is ' : 'is not',
        'in Mar A Lago.',
        'But he\'s gone ' + noOfTrips + ' weekends out of ' + noOfWeekends + ' as President.',
        'Total spent on trips to Mar A Lago is ' + totalCost + ' million dollars.',
        'Counting ' + altName + ', this is equivalent to ' + altNo + ' of ' + altDesc + '.'
    ].join(' ')

    return mainText
}

function figureOutWeekends() {
    var oneDay = 24*60*60*1000;
    var elecday = new Date(2017, 0, 18);
    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var diffDays = Math.floor((today - elecday) / oneDay);
    return Math.ceil(diffDays / 7);
}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

exports.handler = (event, context, callback) => {
    getAlexaResponse(callback)
}

// Test

function test(m, o) {
    console.log(JSON.stringify(o, null, 2))
}

getAlexaResponse(test);
