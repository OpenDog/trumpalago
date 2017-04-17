var bg = {
    goog : {
        callback : function(obj, flag) {
            //object = obj;
            //build database
            this.db = {};
            if(flag === true) {
                for(var i = 0; i < obj.valueRanges.length; i++) {
                    var dbName = obj.valueRanges[i].range.split("!")[0];
                    this.db[dbName] = obj.valueRanges[i].values;
                }
                function buildTotals(db) {
                    var obj = {
                        cost : 0,
                        count : 0
                    };
                    function figureOutWeekends() {
                        var oneDay = 24*60*60*1000;
                        var elecday = new Date(2017, 0, 18);
                        var today = new Date();
                        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        var diffDays = Math.floor((today - elecday) / oneDay);
                        return Math.ceil(diffDays / 7);
                    }
                    //for each row
                    for(var i = 1; i < db.length; i++) {
                        var num = db[i][db[0].indexOf('cost')].split('$').join('').split(',').join('');
                        //num = num.split(',').join();
                        obj.cost = obj.cost + parseInt(num);
                        obj.count = obj.count + 1;
                    }
                    obj.weekends = figureOutWeekends();
                    return obj;
                }
                function buildAlt(db) {
                    var arr = []
                    //for each row
                    for(var i = 1; i < db.length; i++) {
                        var obj = {};
                        //for each column
                        for(var k = 0; k < db[0].length; k++) {
                            if(db[0][k] === 'unitCost') {
                                obj[db[0][k]] = parseInt(db[i][k].split('$').join('').split(',').join(''));
                            } else {
                                obj[db[0][k]] = db[i][k];
                            }
                        }
                        obj.units = Math.round(bg.goog.db.trips.cost / obj.unitCost);
                        arr.push(obj);
                    }
                    return arr;
                }
                this.db.trips = buildTotals(this.db.trips)
                this.db.alternatives = buildAlt(this.db.alternatives);
                this.db.whereuat = this.db.whereuat[1][0];
            } else if(flag === false) {
                ///grab the static data
                console.log('static data used');
                this.db.trips = JSON.parse('{"cost":25200000,"count":7,"weekends":13}');
                this.db.alternatives = JSON.parse('[{"name":"Meals on Wheels","desc":"Meals on Wheels recipients","unitCost":2765,"citationLabel":"How we got this number","citation":"Feeding a senior through Meals on Wheels costs $2,765 a year. President Trump wants to slash their funding. ","units":9114},{"name":"School Lunch","desc":"children fed per year","unitCost":416,"citationLabel":"How we got this number","citation":"The National School Lunch Program provides food assistance to children in schools for only $416 per child per year. ","units":60577},{"name":"Medicaid","desc":"Medicaid recipients","unitCost":5790,"citationLabel":"How we got this number","citation":"Helping low-income people access health care through Medicaid costs $5,790 per recipient a year. President Trump continues to threaten Medicaid funding. ","units":4352},{"name":"Homelessness aid","desc":"years funded","unitCost":4000000,"citationLabel":"How we got this number","citation":"Trump wants to cut the U.S. Interagency Council on Homelessness which combats homelessness, particularly for veterans, and only costs $4 million a year to run.","units":6},{"name":"Nutrition assistance","desc":"meals funded","unitCost":1,"citationLabel":"How we got this number","citation":"The Supplemental Nutrition Assistance Program (SNAP) helps millions of families put food on the table and only costs $1.39 a meal. ","units":25200000},{"name":"Public school funding","desc":"students educated per year","unitCost":12296,"citationLabel":"How we got this number","citation":"It costs a public school around $12,296 a year to educate students. ","units":2049},{"name":"Pell Grants","desc":"Pell Grants per year","unitCost":3690,"citationLabel":"How we got this number","citation":"Pell Grants help low-income students pay for college and have been on Trump\'s chopping block.","units":6829},{"name":"National Park Service","desc":"Trump salary donations","unitCost":78333,"citationLabel":"How we got this number","citation":"President Trump donated his first quarter\'s salary to the National Park Service, which is a drop in the bucket compared to the taxpayer money spent on Mar-a-Lago trips. ","units":322}]');
                this.db.whereuat = 'NO';
            }


            bg.view.init();
            console.log('goog callback fired');
        },
        get : function(worksheets) {
            var ranges = '';
            for(var i = 0; i < worksheets.length; i++) {
                ranges += 'ranges=' + worksheets[i] + '&';
            }
            var url = 'https://sheets.googleapis.com/v4/spreadsheets/1JWfwoJ5uSSxYry0AwGg3oc4FPsprIjWWVKWrFn-KqyE/values:batchGet?' + ranges + 'key=AIzaSyB-Gb6hsgnEaZhE6wGoNIBM2BOumgHqFDQ';
            var r = new XMLHttpRequest();
            r.ontimeout = function () {console.log('XHR timed out'); bg.goog.rerun();};
            r.open('get', url, true);
            r.setRequestHeader('Content-Type', 'application/json');
            r.onreadystatechange = function () {
                if(r.status === 200 && r.readyState === 4 && r.responseText.length > 0) {
                    //console.log('worksheet response is ' + r.status);
                    //pass the obj to a callback fn
                    bg.goog.callback(JSON.parse(r.responseText), true);
                } else if(r.status === 429 && r.readyState === 4){
                    //eek! api quota hit
                    console.log('api quote hit', r.responseText);
                    bg.goog.callback('', false);

                }else if(r.readyState === 4) {
                    //some other error
                    console.log('unknown error', r.responseText);
                    bg.goog.callback('', false);
                }
            };
            r.timeout = 10000;
            r.onerror = function() {console.log('XHR error');}
            r.send();
            return this;
        },
        rerun : function() {
            if(Object.keys(this.db).length > 0) {
                this.db = {};
            }
            this.init();
        },
        init : function(a) {
            this.get(a);
        }
    },
    view : {
        empty : function(elem) {
            while (elem.hasChildNodes()) {
                elem.removeChild(elem.lastChild);
            }
            return elem;
        },
        init : function() {
            //build the select dom
            var options = function() {
                var arr = [];
                var alts = bg.goog.db.alternatives
                for(var i = 0; i < alts.length; i++) {
                    arr.push(
                        bg.view.createElement({elem : 'option', str : alts[i].name, htmlAttribute : [['value', alts[i].name]]})
                    );
                }
                return arr;
            }
            var select = this.createElement({elem : 'select', class : 'elem-options js-options background-color-blue color-white', children : options()});
            //lorem
            var db = bg.goog.db;
            var get = function(a,b) {
                return document.getElementsByClassName(a)[b];
            }
            var dom = {
                answer : get('js-answer',0),
                answerDetail : get('js-answer-details',0),
                spentAmt : get('js-spent-amt',0),
                options : get('js-options',0),
                spentAmtAlt : get('js-spent-amt-alt',0),
                spentLabelAlt : get('js-spent-label-alt',0),
                spentCitationLabelAlt : get('js-spent-citationLabel-alt',0),
                spentCitationAlt : get('js-spent-citation-alt',0)
            };
            function formatNumber(n) {
                var rvalue;
                if(n > 999999) {
                    rvalue = (n/1000000).toFixed(0) + 'm';
                } else if(n > 999) {
                    rvalue = (n/1000).toFixed(0) + 'k';
                } else {
                    rvalue = n;
                }
                return rvalue;
            }
            dom.answer.innerText = db.whereuat;
            dom.answerDetail.innerText = (db.whereuat === 'YES' ? 'This makes ' : 'But he\'s gone ') + db.trips.count + ' weekends out of ' + db.trips.weekends + ' as President.';
            dom.spentAmt.innerText = '$' + formatNumber(db.trips.cost);
            dom.options.parentNode.appendChild(select);
            dom.options.parentNode.removeChild(dom.options);
            dom.spentAmtAlt.innerText = formatNumber(db.alternatives[0].units);
            dom.spentLabelAlt.innerText = db.alternatives[0].desc;
            dom.spentCitationLabelAlt.innerText = db.alternatives[0].citationLabel;
            dom.spentCitationAlt.innerText = db.alternatives[0].citation;
            //bind to the drop down menu;
            bg.binders();
        },
        update : function() {
            var get = function(a,b) {
                return document.getElementsByClassName(a)[b];
            }
            var value = this.value;
            var db = bg.goog.db.alternatives;
            function formatNumber(n) {
                var rvalue;
                if(n > 999999) {
                    rvalue = (n/1000000).toFixed(0) + 'm';
                } else if(n > 999) {
                    rvalue = (n/1000).toFixed(0) + 'k';
                } else {
                    rvalue = n;
                }
                return rvalue;
            }
            for(var i = 0; i < db.length; i++){
                if(db[i].name === value) {
                    var get = function(a,b) {
                        return document.getElementsByClassName(a)[b];
                    }
                    var dom = {
                        spentAmtAlt : get('js-spent-amt-alt',0),
                        spentLabelAlt : get('js-spent-label-alt',0),
                        spentCitationLabelAlt : get('js-spent-citationLabel-alt',0),
                        spentCitationAlt : get('js-spent-citation-alt',0)
                    };
                    dom.spentAmtAlt.innerText = formatNumber(db[i].units);
                    dom.spentLabelAlt.innerText = db[i].desc;
                    dom.spentCitationLabelAlt.innerText = db[i].citationLabel;
                    dom.spentCitationAlt.innerText = db[i].citation;
                }
            }
        },
        createElement : function(o, k, d) {
            //.createElement({elem : 'div'}); //minimum
            //var o = { elem : '', class : '', id : '', str : '', src : '', htmlAttribute : [['this',that'], ['then', there']]children : [] };
            if(typeof o === 'object' && o.hasOwnProperty('elem')) {
                d = document.createElement(o.elem);
                var k = Object.keys(o).filter(function(i) {
                    return i != 'elem'
                });;
                for(var i = 0; i < k.length; i++) {
                    switch(k[i]) {
                        case 'str' :
                        case 'string':
                        case 'innerHTML':
                            //ddddrrrrroop
                            d.innerHTML  = o[k[i]];
                            break;
                        case 'innerText':
                            d.innerText = o[k[i]];
                            break;
                        case 'children':
                            //can pass an array of fns or objs
                            for(var q = 0; q < o.children.length; q++) {
                                if(o.children[q].nodeType) {
                                    d.appendChild(o.children[q]);
                                } else {
                                    d.appendChild(this.createElement(o.children[q]));
                                }
                            }
                            break;
                        case 'htmlAttribute':
                            //can pass an array of array pairs [['data-storage', 'data value']]
                            for(var q = 0; q < o.htmlAttribute.length; q++) {
                                d.setAttribute(o.htmlAttribute[q][0], o.htmlAttribute[q][1]);
                            }
                            break;
                        case 'listener':
                            for(var q = 0; q < o.listener.length; q++) {
                                var key = o.listener[q][0];
                                var value = o.listener[q][1];
                                d.addEventListener(key, value, false);
                            }
                            break;
                        default:
                            d.setAttribute(k[i], o[k[i]]);
                    }
                }
            } else {
                d = document.createElement('div');
            }
            return d;
        },
        toggleCitation : function() {
            this.parentNode.getElementsByClassName('elem-citation')[0].classList.toggle('hide');
        }
    },
    binders : function() {
        console.log('binders fired');
        document.getElementsByClassName('js-options')[0].addEventListener('change', bg.view.update, false);

        var cites = document.getElementsByClassName('elem-citationLabel');
        for(var i = 0; i < cites.length; i++) {
            cites[i].addEventListener('click', bg.view.toggleCitation, false);
        }
    },
    init : function() {
        //shim for classList
        "classList"in document.documentElement||!Object.defineProperty||"undefined"==typeof HTMLElement||Object.defineProperty(HTMLElement.prototype,"classList",{get:function(){function b(b){return function(c){var d=a.className.split(/\s+/),e=d.indexOf(c);b(d,e,c),a.className=d.join(" ")}}var a=this,c={add:b(function(a,b,c){~b||a.push(c)}),remove:b(function(a,b){~b&&a.splice(b,1)}),toggle:b(function(a,b,c){~b?a.splice(b,1):a.push(c)}),contains:function(b){return!!~a.className.split(/\s+/).indexOf(b)},item:function(b){return a.className.split(/\s+/)[b]||null}};return Object.defineProperty(c,"length",{get:function(){return a.className.split(/\s+/).length}}),c}});
        //end shim
        //send out goog request
        this.goog.init(['whereuat', 'trips', 'alternatives']);
    }
}
bg.init();
