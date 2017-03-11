var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var Uber = require('node-uber');
var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyDdt5T24u8aTQG7H2gOIQBgcbz00qMcJc4' 
});

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: '', // process.env.MICROSOFT_APP_ID,
    appPassword: '' // process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'Index.html'})
);	

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [

    // send the intro
    function (session, args, next){
        session.send("Hello and welcome to Travelr! Just tell \
        us where you are going and we will get you there as quickly as \
        possible!");
        next();
    },

    // get the user's starting location
    function(session){
        builder.Prompts.text(session, "What is your starting location");
    },

    // save the result
    function (session, result, next) {
        console.log();
        var test;
        var test2;
        session.userData.start = result.response;

        // call the google maps function to get the coordinates
        googleMapsClient.geocode({
            address: session.userData.start
            }, function(err, response) {
                if (!err) {

                    // get the latitutde
                    test = response.json.results[0].geometry.location.lat;

                    // get the longitude
                    test2 = response.json.results[0].geometry.location.lng
                    
                }
            
            })
        
        setTimeout(function() {
            session.userData.start_lat = test;
            session.userData.start_long = test2;
            next();
        }, 2000);
        
    },

    // get the user's destination location
    function(session) {
        builder.Prompts.text(session, "What is your destination?");
        console.log();
    },

    // save the results
    function(session, results, next) {
        session.userData.end = results.response;
        console.log();

        googleMapsClient.geocode({
            address: session.userData.end
            }, function(err, responses) {
                if (!err) {

                    // get the latitutde
                    session.userData.end_lat = responses.json.results[0].
                    geometry.location.lat;

                    // get the longitude
                    session.userData.end_long = responses.json.results[0].
                    geometry.location.lng
                }
            });

        next();
    },

    // begin processing the information
    function(session, args, next) {
        session.send("Hold on while we get your results!");
        setTimeout(function() {
            next();
        }, 2000);
    },

    /* get uber
    function(session, args, next) {

        
        next();
    }, 

    // get lyft
    function(session, args, next) {

        next();
    },

    */

    // get transit
    function(session, arg, next) {

        // blank line
        console.log();

        googleMapsClient.directions({
            origin: {
                lat: session.userData.start_lat,
                lng: session.userData.start_long
            },
            destination: {
                lat: session.userData.end_lat,
                lng: session.userData.end_long
            },
            mode: "transit"
        }, function(err, response) {

            if(!err){

                // get the fair 
                //console.log(response.json);

                console.log();

                //console.log(response.json.routes);

                console.log();
                
                // get the time, distance, and route
                //console.log(response.json.routes[0].legs);

                console.log();
                var legs = response.json.routes[0].legs[0];
                //console.log(legs);

                // send the depart time 
                session.send("Depart Time: " + legs.departure_time.text);

                // send the arrival time 
                session.send("Arrival Time: " + legs.arrival_time.text);
 
                // send the trip time
                session.send("Total Time: " + legs.duration.text);

                // send the distance 
                session.send("Total Distance: " + legs.distance.text);

                // send the steps
                var f; 
                for (f in legs.steps){console.log(legs.steps[f]);
                    console.log();}

                var q;
                var r; 
                for (q in legs.steps) {

                    var string = ""

                    if (legs.steps[q].travel_mode == 'WALKING')
                    {
                        // log the big instruction 
                        string += (legs.steps[q].html_instructions);
                        string += "\n";

                        for (r in legs.steps[q].steps)
                        {
                            string += (legs.steps[q].steps[r].html_instructions);
                            string += '\n';
                        }
                        session.send(string)
                        console.log();
                    }

                    else
                    {
                        // log the main html_instructions
                        console.log(legs.steps[q].html_instructions);

                        string += (legs.steps[q].html_instructions);

                        var transit = legs.steps[q].transit_details; 

                        string += ("Arrival Stop Name:" + transit.arrival_stop.name);
                        string += '\n';

                        string += ("Arrival Time: " + transit.arrival_time.text);
                        string += '\n';

                        string += ("Departure Stop Name: " + transit.departure_stop.name);
                        string += '\n';

                        string += ("Departure Time: " + transit.departure_time.text);
                        string += '\n';

                        string += ("Headsign: "+ transit.headsign);
                        string += '\n';

                        console.log();
                        session.send(string);
                    }
                    
                }   
                next();
            }
        
        // clean up
        /*
        session.clearDialogStack();
        session.endDialog();
        session.endConversation();
        */
        });

    },

    function(session, args, next)
    {
        console.log("in uber");

        // initialize an uber object
        var uber = new Uber({
            client_id: '4-FEfPZXTduBZtGu6VqBrTQvg0jZs8WP',
            client_secret: 'vAy-juG54SV15yiv7hsDgVMegvMDPbjbtuayZ48a',
            server_token: '2By_BZgRZCMelkCHxVyWUCcTg1z6UfkPfo7UZM6O',
            redirect_uri: '',
            name: 'TravelrApp',
        });

        console.log(session.userData.start_lat);
        console.log(session.userData.end_lat);

        // get the price estimate information
        uber.estimates.getPriceForRoute(session.userData.start_lat
        , session.userData.start_long, session.userData.end_lat
        , session.userData.end_long, function(err, res){

            var prices = res.prices;

            console.log(prices);

            // send the duration and the distance 
            var duration = prices[0].duration / 60
            session.send("Duration: " + duration.toString() + " minutes");

            session.send("Distance: " + prices[0].distance);

            var u;
            

            for (u in prices) 
            {
                // blank string to hold the stats
                var uber_string = "";
                
                uber_string += ("Name: " + prices[u].localized_display_name);
                uber_string += " ";

                uber_string += ("Surge Multiplier: " + prices[u].surge_multiplier);
                uber_string += " ";

                uber_string += ("Estimate: " + prices[u].estimate);
                uber_string += " ";

                // send the string 
                session.send(uber_string);
            }
            
        });

        next();
    },

    function (session, args, next)
    {
        
        var access_token; 

        client_token = 'gAAAAABYw0rkJ3ukCF7xG_88XPPRK0fguyi2Ub2RF2gOnwcY7z8bQYflrhwkh24c3OsHAfBtH0Xbb8r-VQxmk8y01BBl-SymiBE8Lz0wlkG5Sa2VdQUo86AP1ncyRpGKQ_rYc66jfExJ_m1bpEaotykPMVNZzrObZ0JVEBdPRbDhZ4dXLbIQ_l4='
        client_secret = '9Jz-WN7J3dMoVFcMhw9wGtVcDg1fK1gV'

        var headers = {
            'Content-Type': 'application/json'
        };

        var dataString = '{"grant_type": "client_credentials", "scope": "public"}';
        
        var options = {
            url: 'https://api.lyft.com/oauth/token',
            method: 'POST',
            headers: headers,
            body: dataString,
            auth: {
                'user': '9LHHn1wknlgs',
                'pass': '9Jz-WN7J3dMoVFcMhw9wGtVcDg1fK1gV'
            }
        };

        request(options, function(err, obj, res){
            if (err){
                console.log(err);
            }

            else{

                // get the access token 
                var parsed = JSON.parse(res);
                var access_token = parsed.access_token;
                console.log(res);
                console.log(access_token);

                var headers = {
                     'Authorization': 'bearer ' + access_token
                };

                var url_lyft = 'https://api.lyft.com/v1/cost?start_lat=' + 
                    session.userData.start_lat + '&start_lng=' + 
                    session.userData.start_long + '&end_lat=' +
                    session.userData.end_lat + '&end_lng=' +
                    session.userData.end_long;


                // create the get request 
                var options = {
                    url: url_lyft,
                    method: "GET",
                    headers: headers,
                };

                request(options, function(err, obj, res)
                {
                    if (err)
                    {
                        console.log(err);
                    }

                    else
                    {
                        // parse the json 
                        var lyft_pared = JSON.parse(res);
                        console.log(lyft_pared);

                        var l; 
                        for (l in lyft_pared.cost_estimates)
                        {
                            // string to hold information
                            var lyft_string = "";

                            lyft_string += 'Ride Type: ' +
                            lyft_pared.cost_estimates[l].ride_type + "  ";

                            lyft_string += 'Distance: ' + 
                            lyft_pared.cost_estimates[l].estimated_distance_miles + '  ';

                            var duration = lyft_pared.cost_estimates[l].estimated_duration_seconds / 60;
                            lyft_string += "Duration: " + duration + 'miles   ';

                            var cost_min = lyft_pared.cost_estimates[l].estimated_cost_cents_min / 100;
                            var cost_max = lyft_pared.cost_estimates[l].estimated_cost_cents_max / 100;
                            lyft_string += "Cost Estimate: $" + cost_min + "-" + cost_max + '  ';

                            lyft_string += 'Primetime Percentage: ' +
                            lyft_pared.cost_estimates[l].primetime_percentage + '  ';

                            session.send(lyft_string);
                        }
                    }
                })
            }

        });

    }

]);