/*jslint node: true */
/*jshint -W098 */
'use strict';
//Add web server stuff. 
const path = require('path');
//Local hosting
const express = require('express');

var util = require('util');
var _ = require('underscore');
var clc = require('cli-color');
var moment = require('moment');
var VistaJS = require('./VistaJS');
const configuration = require('./config');
var VistaJSLibrary = require('./VistaJSLibrary');
const bodyParser = require('body-parser');
const { openaiClient, initializeClient } = require('./openaiClient');

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


/*
    ToDo: Add FM Date Calculator
          Add Endpoint to Write Note
          Add FE to collect note data
          Add to FE lookup for the patient
          add to FE lookup for note title. 
          Add Priompt for esignature. 
          

*/

var logger = require('bunyan').createLogger({
    name: 'RpcClient',
    level: 'info'
});

function inspect(obj) {
    return obj ? util.inspect(obj, {
        depth: null
    }) : '';
}

function printResult(error, result) {
    console.log(clc.red(inspect(error)));
    console.log(clc.cyan(inspect(result)));
}
function signDocument(error,result){
    var signature = VistaJSLibrary.buildEncryptedSigString(configuration.sig);
    VistaJS.callRpc(logger, configuration, 'TIU SIGN RECORD', result,signature, printJsonResult);
}
function printJsonResult(error, result) {
    console.log(clc.red(inspect(error)));
    var output = result;
    try {
        output = JSON.parse(result);
    } catch (err) {
         //use default
    }
    console.log(clc.cyan(inspect(output)));
}



function createNote(){


    //  Sample RCP to test. 
    /*  This sample below executes the RPC 'SDES GET USER PROFILE BY DUZ' with the Context from the config file. 
        This is a test to ensure you are connecting to VistA.  The context is originally set with the config file, but youcan change it
        And you will need to to set context to the CPRS context. 
    */
   
    
    //VistaJS.callRpc(logger, configuration, 'SDES GET USER PROFILE BY DUZ', [VistaJS.RpcParameter.literal('1')],printJsonResult);

    /** Note Creation **
       There are two different types of notes.  A note that has an encounter (a little more complicated) and a note
       that is called historical.  Historical notes do not have an encounter atached to them. 
       The process is the same with VistAJS and vista-api (you are calling RPCS).  
    
       https:vivian.worldvista.org/dox/Routine_TIUSRVP_source.html
    
            MAKE(SUCCESS,DFN,TITLE,VDT,VLOC,VSIT,TIUX,VSTR,SUPPRESS,NOASF) ; New Document
                ; SUCCESS = (by ref) TIU DOCUMENT # (PTR to 8925)
                ;         = 0^Explanatory message if no SUCCESS
                ; DFN     = Patient (#2)
                ; TITLE   = TIU Document Definition (#8925.1)
                ; [VDT]   = Date(/Time) of Visit
                ; [VLOC]  = Visit Location (HOSPITAL LOCATION)
                ; [VSIT]  = Visit file ien (#9000010)
                ; [VSTR]  = Visit string (i.e., VLOC;VDT;VTYPE)
                ; [NOASF] = if 1=Do Not Set ASAVE cross-reference
                ; TIUX    = (by ref) array containing field data and document body
    
            Example Pulled from CPRS SHOWRPCS:
    
            TIU CREATE RECORD 
            https://vivian.worldvista.org/vivian-data/8994/8994-97.html
                      
                Params ------------------------------------------------------------------
                literal	418
                literal	16
                literal	
                literal	
                literal	
                list	
                    (1202)=983
                    (1301)=3221101.1204
                    (1205)=64
                    (1701)=
                literal	64;3221101.105317;E
                literal	1
                
                Results -----------------------------------------------------------------
                4277
    
    
    
       https:vivian.worldvista.org/vivian-data/8994/8994-97.html
        //'(1202)': '983',
                 //'(1301)': 'N',
    */
    
    console.log("Creating a note.....")
     
    
    var note = [
             418,// DFN
             1660, // Note Title IEN
             '', 
             '64', //Location IEN
             '',
             {
                '(1701)': '',
                 '(1205)': '64', //Location IEN
                 '"TEXT",1,0': 'This is an Example of Writing a note To Patient 6.',
                 '"TEXT",2,0': 'The data is all Manually entered to simplify the Example.',
                 '"TEXT",3,0': 'vista-api would use the same input just uing VistAJS to make thismore portable.',
                 '"TEXT",4,0': 'Open Six,Patient to see the note.',
                 '"TEXT",4,0': 'I immediatly sign the note in this example.',
             },
             '64;3221101.123327;E',  //Vist information location;FM date;type
             '1'
            ]
        /*
            Context below is the security context or VistA MEnu option that the RPC is in.
        */
        // configuration.context='OR CPRS GUI CHART'
        console.log('Executing RPC...')
        // VistaJS.callRpc(logger, configuration, 'TIU CREATE RECORD', note, signDocument);
    



}




app.get('/noteTitles', (request, response) => {

    var titles = [
        {"ien":"1660","title":"ATTENDING NOTE"},
        {"ien":"16","title":"PRIMARY CARE VISIT"},
        {"ien":"18","title":"CARE TELEPHONE"},
        {"ien":"22","title":"CARE GENERAL NOTE"},
        {"ien":"29","title":"EMERGENCY DEPARTMENT NOTE"},
    ]

    response.send(titles)

})
app.get('/patients', (request, response) => {
     configuration.context = 'OR CPRS GUI CHART';
    VistaJS.callRpc(logger, configuration, 'ORQPT DEFAULT PATIENT LIST', [],function(error,data){
        
        var respArr = data.split("\r\n");
        var dataArr =[]
        respArr.forEach(function(e){
            var rec = e.split("^")
            dataArr.push(rec)
        })
        var list = []
        dataArr.forEach(function(e,i){
           
            if(e[1]){
                var rec ={}
                rec['dfn']=e[0]
                rec['name']=e[1]
                list.push(rec)
            }
        })
        response.send(list)
    });
})

app.post('/note', (request, response) => {
    var data=request.body
    
    // Require clinic IEN - error if not provided
    if (!data.clinicIen) {
        return response.status(400).json({ error: 'Clinic IEN is required. Please select an appointment first.' });
    }
    
    // Require DUZ - error if not provided in config
    if (!configuration.duz) {
        return response.status(500).json({ error: 'DUZ is required in configuration.' });
    }
    
    // Convert ISO datetime to FileMan datetime format
    function convertToFileManDateTime(isoDateTime) {
        if (!isoDateTime) return '';
        
        try {
            // Parse without timezone conversion to preserve literal date/time values
            var date = moment.parseZone(isoDateTime);
            if (!date.isValid()) return '';
            
            console.log('Input ISO datetime:', isoDateTime);
            console.log('Parsed date (no timezone conversion):', date.format());
            
            // FileMan date format: YYYMMDD.HHMM (no seconds)
            // Where YYY is years since 1700
            var year = date.year();
            var filemanYear = year - 1700;
            var month = date.format('MM');
            var day = date.format('DD');
            var hour = date.format('HH');
            var minute = date.format('mm');
            
            console.log('Year:', year, 'FileMan Year:', filemanYear);
            console.log('Month:', month, 'Day:', day, 'Hour:', hour, 'Minute:', minute);
            
            var result = filemanYear + month + day + '.' + hour + minute;
            console.log('FileMan result:', result);
            
            return result;
        } catch (err) {
            console.error('Error converting datetime to FileMan format:', err);
            return '';
        }
    }
    
    var clinicIen = data.clinicIen;
    var fmDateTime = convertToFileManDateTime(data.dateTime);
    var text={
        '(1701)': '',
        '(1205)': clinicIen, //Location IEN from appointment
        }
    
    data.body.forEach(function(e,i){
        var line=i+1
        text['"TEXT",'+line+',0']=e
      })

    var note = [
        data.dfn,// DFN
        data.noteTitle, // Note Title IEN
        '', 
        clinicIen, //Location IEN from appointment
        '',
        text,
        clinicIen + ';' + fmDateTime + ';A',  //Visit information location;FM appointment date/time;type
        configuration.duz // DUZ from config (required)
       ]
       console.log('FileMan DateTime:', fmDateTime);
       console.log(note)
       VistaJS.callRpc(logger, configuration, 'TIU CREATE RECORD', note,printResult);
       //VistaJS.callRpc(logger, configuration, 'TIU CREATE RECORD', note, signDocument);
       response.sendStatus(200)
})

app.get('/appointments', (request, response) => {
    // Set the appropriate context for scheduling appointments
    configuration.context = 'SDECRPC';
    
    // Get clinic IEN from config
    var clinicIen = configuration.clinicIen;
    
    // Auto-generate today's date range
    var today = moment();
    var startDate = today.format('YYYY-MM-DDTHH:mm:ss-04:00').replace('T' + today.format('HH:mm:ss'), 'T00:00:00');
    var endDate = today.format('YYYY-MM-DDTHH:mm:ss-04:00').replace('T' + today.format('HH:mm:ss'), 'T23:59:59');
    
    // Call the RPC with clinic IEN and date parameters (dates in ISO format, not FileMan)
    var rpcParams = [clinicIen, startDate, endDate];
    
    VistaJS.callRpc(logger, configuration, 'SDES GET APPTS BY CLIN IEN 3', rpcParams, function(error, data) {
        if (error) {
            console.error('Error calling SDES GET APPTS BY CLIN IEN 3:', error);
            response.status(500).json({ error: 'Failed to retrieve appointments', details: error });
            return;
        }
        
        // Clean control characters that might cause JSON parsing issues
        if (data && typeof data === 'string') {
            // Remove all control characters
            data = data.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
            // Fix any resulting malformed JSON from the cleaning
            data = data.replace(/"([^"]+)":"(\s*)",/g, '"$1":"",');
            data = data.replace(/"([^"]+)":"(\s*)"/g, '"$1":""');
        }
        
        try {
            // Parse the JSON response
            var jsonData = JSON.parse(data);
            var fhirEntries = [];
            
            // Extract appointments from the JSON structure, excluding cancelled ones
            if (jsonData.Appointment && Array.isArray(jsonData.Appointment)) {
                jsonData.Appointment.forEach(function(appt, index) {
                    // Skip empty entries and cancelled appointments
                    if (appt && typeof appt === 'object' && 
                        (!appt.AppointmentCancelled || appt.AppointmentCancelled === '')) {
                        
                        // Convert VistA appointment to FHIR R4 Appointment resource
                        var fhirAppointment = {
                            resourceType: "Appointment",
                            id: "vista-appt-" + (appt.AppointmentIEN || index),
                            status: appt.CurrentStatus ? 
                                (appt.CurrentStatus.toLowerCase().includes('scheduled') ? "booked" : "pending") : "booked",
                            serviceCategory: [{
                                coding: [{
                                    system: "http://terminology.hl7.org/CodeSystem/service-category",
                                    code: "17",
                                    display: "General Practice"
                                }]
                            }],
                            serviceType: [{
                                coding: [{
                                    system: "http://terminology.hl7.org/CodeSystem/service-type",
                                    code: "124",
                                    display: "General Practice"
                                }]
                            }],
                            appointmentType: {
                                coding: [{
                                    system: "http://terminology.hl7.org/CodeSystem/v2-0276",
                                    code: "ROUTINE",
                                    display: "Routine appointment"
                                }]
                            },
                            start: appt.AppointmentDateTime || "",
                            end: appt.AppointmentDateTime || "", // VistA doesn't provide end time, using start
                            participant: [
                                {
                                    actor: {
                                        reference: "Patient/" + (appt.Patient ? appt.Patient.DFN : "unknown"),
                                        display: appt.Patient ? appt.Patient.Name : "Unknown Patient"
                                    },
                                    status: "accepted"
                                },
                                {
                                    actor: {
                                        reference: "Location/" + (appt.Clinic ? appt.Clinic.ClinicIEN : clinicIen),
                                        display: appt.Clinic ? appt.Clinic.Name : "Clinic " + clinicIen
                                    },
                                    status: "accepted"
                                }
                            ],
                            meta: {
                                source: "VistA",
                                lastUpdated: new Date().toISOString(),
                                profile: ["http://hl7.org/fhir/StructureDefinition/Appointment"]
                            }
                        };
                        
                        fhirEntries.push({
                            fullUrl: "Appointment/vista-appt-" + (appt.AppointmentIEN || index),
                            resource: fhirAppointment
                        });
                    }
                });
            }
            
            // Create FHIR R4 Bundle response
            var fhirBundle = {
                resourceType: "Bundle",
                id: "vista-appointments-" + today.format('YYYY-MM-DD'),
                type: "searchset",
                timestamp: new Date().toISOString(),
                total: fhirEntries.length,
                link: [{
                    relation: "self",
                    url: request.protocol + '://' + request.get('host') + request.originalUrl
                }],
                entry: fhirEntries,
                meta: {
                    source: "VistA",
                    lastUpdated: new Date().toISOString()
                }
            };
            //console.log(fhirBundle)
            response.json(fhirBundle);
            
        } catch (parseError) {
            console.error('Error parsing appointment JSON data:', parseError);
            response.status(500).json({ error: 'Failed to parse appointment data', details: parseError.message });
        }
    });
})

app.post('/ai-enhance', async (request, response) => {
    try {
        const { noteContent } = request.body;
        
        if (!noteContent || noteContent.trim() === '') {
            return response.status(400).json({ error: 'Note content is required' });
        }
        
        if (!configuration.aiPrompt) {
            return response.status(400).json({ error: 'AI prompt is not configured' });
        }
        
        if (!configuration.AZURE_OPENAI_API_KEY) {
            return response.status(500).json({ error: 'Azure OpenAI API key is not configured' });
        }
        
        // Initialize OpenAI client (using gpt-4o model, adjust as needed)
        const client = initializeClient('gpt-4o');
        
        // Combine the configured prompt with the note content
        const fullPrompt = configuration.aiPrompt + '\n\nNote Content:\n' + noteContent;
        
        console.log('Sending to AI:', { prompt: configuration.aiPrompt, noteLength: noteContent.length });
        
        // Call OpenAI
        const aiResponse = await openaiClient(client, fullPrompt);
        
        console.log('AI response received:', aiResponse.substring(0, 100) + '...');
        
        response.json({
            originalContent: noteContent,
            enhancedContent: aiResponse,
            prompt: configuration.aiPrompt
        });
        
    } catch (error) {
        console.error('AI enhancement error:', error);
        response.status(500).json({ 
            error: 'Failed to enhance note with AI', 
            details: error.message 
        });
    }
});

    
    var port = process.env.PORT || 4567;

    app.listen(port, () => {
      console.log('Express webserver server running on http://localhost:' + port);
    });