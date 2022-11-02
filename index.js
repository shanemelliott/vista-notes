/*jslint node: true */
/*jshint -W098 */
'use strict';

var util = require('util');
var _ = require('underscore');
var clc = require('cli-color');
var moment = require('moment');
var VistaJS = require('./VistaJS');
const configuration = require('./config');
var logger = require('bunyan').createLogger({
    name: 'RpcClient',
    level: 'info'
});
var VistaJSLibrary = require('./VistaJSLibrary');
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
    console.log(signature)
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

/* This sample below executes the RPC 'SDES GET USER PROFILE BY DUZ' with the Context from the config file. 
   This is a test to ensure you are connecting to VistA.  The context is originally set with the config file, but youcan change it
   And you will need to to set context to the CPRS context. 
*/
console.log('Executing RPC...')
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

console.log("Creating a historical note.....")
 

var note = [
         418,// DFN
         1660, // Note Title IEN
         '', 
         '64', //Location IEN
         '',
         {
            '(1701)': '',
             '(1205)': '64', //Location IEN
             '"TEXT",1,0': 'This is an Example of Writing a note.',
             '"TEXT",2,0': 'The data is all Manually entered to simplify the Example.',
             '"TEXT",3,0': 'vista-api would use the same input just uing VistAJS to make thismore portable.',
             '"TEXT",4,0': 'Open Six,Patient to see the note.',
             '"TEXT",4,0': 'I immediatly sign the note in this example.',
         },
         '64;3221101.123327;E',  //Vist information location;date;type
         '1'
        ]
    /*
        Context below is the security context or VistA MEnu option that the RPC is in.
    */
     configuration.context='OR CPRS GUI CHART'
     VistaJS.callRpc(logger, configuration, 'TIU CREATE RECORD', note, signDocument);

    
