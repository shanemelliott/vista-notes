$(function () {
    
//Get Note Titles
  $.getJSON(
    'http://localhost:4567/noteTitles'
      ,function (response) {
     var newOptionsSelect
     response.forEach((e,i) => {
      newOptionsSelect = newOptionsSelect + '<option value="'+e.ien+'">'+e.title+ '</option>';
    })
    $('#noteTitleId').append( newOptionsSelect )
  })

//Get Today's Appointments
$.getJSON(
  'http://localhost:4567/appointments'
    ,function (response) {
      // Handle FHIR R4 Bundle response
      var appointments = [];
      //console.log(response)
      if (response.resourceType === "Bundle" && response.entry) {
        // Extract appointment data from FHIR Bundle entries
        appointments = response.entry.map(function(entry) {
          var fhirAppt = entry.resource;
          var patientParticipant = fhirAppt.participant.find(p => p.actor.reference.startsWith('Patient/'));
          var locationParticipant = fhirAppt.participant.find(p => p.actor.reference.startsWith('Location/'));
          
          return {
            name: patientParticipant ? patientParticipant.actor.display : 'Unknown Patient',
            dfn: patientParticipant ? patientParticipant.actor.reference.replace('Patient/', '') : '',
            clinicIen: locationParticipant ? locationParticipant.actor.reference.replace('Location/', '') : '',
            appointmentDateTime: fhirAppt.start || '',
            status: fhirAppt.status || ''
          };
        });
      }
      
      displayAppointments(appointments);
    })
    .fail(function() {
      $('#appointmentsContainer').html('<div class="alert alert-warning">Failed to load appointments</div>');
    });

function displayAppointments(appointments) {
  var appointmentsHtml = '';
  
  if (appointments && appointments.length > 0) {
    appointmentsHtml = '<div class="list-group">';
    
    appointments.forEach(function(appt, index) {
      // Parse time without timezone conversion - extract literal time values
      var appointmentTime = '';
      if (appt.appointmentDateTime) {
        try {
          // Extract time portion from ISO string (e.g., "2025-08-20T13:15:00-04:00" -> "13:15")
          var timeMatch = appt.appointmentDateTime.match(/T(\d{2}):(\d{2})/);
          if (timeMatch) {
            var hour = parseInt(timeMatch[1]);
            var minute = timeMatch[2];
            var period = hour >= 12 ? 'PM' : 'AM';
            var displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
            appointmentTime = displayHour + ':' + minute + ' ' + period;
          } else {
            appointmentTime = 'Time unavailable';
          }
        } catch (err) {
          appointmentTime = 'Time unavailable';
        }
      }
      
      appointmentsHtml += `
        <div class="list-group-item appointment-item" 
             data-dfn="${appt.dfn}" 
             data-clinic-ien="${appt.clinicIen}" 
             data-appointment-datetime="${appt.appointmentDateTime}"
             style="cursor: pointer;">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${appt.name}</h6>
            <small class="text-primary">${appointmentTime}</small>
          </div>
          <p class="mb-1">${appt.status}</p>
          <small class="text-muted">Click to select patient for note writing</small>
        </div>
      `;
    });
    
    appointmentsHtml += '</div>';
  } else {
    appointmentsHtml = '<div class="alert alert-info">No appointments scheduled for today</div>';
  }
  
  $('#appointmentsContainer').html(appointmentsHtml);
  
  // Add click handlers for appointment selection
  $('.appointment-item').click(function() {
    var dfn = $(this).data('dfn');
    var clinicIen = $(this).data('clinic-ien');
    var appointmentDateTime = $(this).data('appointment-datetime');
    
    // Highlight the selected appointment
    $('.appointment-item').removeClass('active');
    $(this).addClass('active');
    
    // Store appointment data for note saving
    window.selectedAppointment = {
      dfn: dfn,
      clinicIen: clinicIen,
      fmDateTime: appointmentDateTime // Send ISO datetime, server will convert to FileMan
    };
    
    console.log('Selected appointment:', window.selectedAppointment);
  });
}


$('#saveNote').click(function(){
  
  // Check if an appointment is selected
  if (!window.selectedAppointment || !window.selectedAppointment.dfn) {
    alert('Please select an appointment first');
    return;
  }

  $.ajax({
    type: "POST",
    url: 'http://localhost:4567/note',
    data: {
      "dfn": window.selectedAppointment.dfn,
      "clinicIen": window.selectedAppointment.clinicIen,
      "dateTime": window.selectedAppointment.fmDateTime,
      "noteTitle":$('#noteTitleId').find('option:selected').val(),
      "body":$('#noteBody').val().split('\n')
    },
    success: function(data){
      $('#noteBody').val('')
      alert('Note saved successfully!')
      console.log('Note saved for patient DFN:', window.selectedAppointment.dfn, 'Clinic IEN:', window.selectedAppointment.clinicIen)
    },

  });


})

$('#resetAll').click(function(){
  // Clear the note editor
  $('#noteBody').val('');
  
  // Clear selected appointment
  $('.appointment-item').removeClass('active');
  window.selectedAppointment = null;
  
  // Reset note title to first option
  $('#noteTitleId').prop('selectedIndex', 0);
  
  console.log('Form reset completed');
})

$('#noteTitleId').change(function(){
    var selected = $(this).find('option:selected');
    console.log(selected.val())
  })

// AI Enhance button click handler
$('#aiEnhanceBtn').click(function(){
  var noteContent = $('#noteBody').val().trim();
  
  if (!noteContent) {
    alert('Please enter some note content first');
    return;
  }
  
  // Show loading state
  var originalText = $(this).text();
  $(this).prop('disabled', true).text('Processing...');
  
  $.ajax({
    type: "POST",
    url: 'http://localhost:4567/ai-enhance',
    contentType: 'application/json',
    data: JSON.stringify({
      noteContent: noteContent
    }),
    success: function(data){
      // Replace note content with AI enhanced version
      $('#noteBody').val(data.enhancedContent);
      
      // Auto-scroll to bottom of textarea
      var textarea = document.getElementById('noteBody');
      textarea.scrollTop = textarea.scrollHeight;
      
      alert('Note enhanced successfully with AI!');
      console.log('AI Enhancement completed');
    },
    error: function(xhr, status, error) {
      var errorMsg = 'Failed to enhance note with AI';
      try {
        var response = JSON.parse(xhr.responseText);
        errorMsg = response.error || errorMsg;
      } catch(e) {
        // Use default error message
      }
      alert(errorMsg);
      console.error('AI Enhancement error:', error);
    },
    complete: function() {
      // Reset button state
      $('#aiEnhanceBtn').prop('disabled', false).text(originalText);
    }
  });
});

// Speech Recognition Setup
var recognition;
var isListening = false;

// Check if browser supports speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  // Configure recognition settings
  recognition.continuous = true;  // Keep listening until stopped
  recognition.interimResults = true;  // Show interim results
  recognition.lang = 'en-US';  // Set language
  recognition.maxAlternatives = 1;
  
  // Handle speech recognition results
  recognition.onresult = function(event) {
    var transcript = '';
    var interimTranscript = '';
    
    for (var i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    // Add final transcript to the note editor
    if (transcript) {
      var currentText = $('#noteBody').val();
      var newText = currentText + (currentText ? ' ' : '') + transcript;
      $('#noteBody').val(newText);
      
      // Auto-scroll to bottom of textarea
      var textarea = document.getElementById('noteBody');
      textarea.scrollTop = textarea.scrollHeight;
    }
    
    // Show interim results in status
    if (interimTranscript) {
      $('#speechStatus').text('Listening: ' + interimTranscript);
    }
  };
  
  // Handle speech recognition errors
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    $('#speechStatus').text('Error: ' + event.error);
    stopDictation();
  };
  
  // Handle when speech recognition ends
  recognition.onend = function() {
    if (isListening) {
      // If we were supposed to be listening, restart (for continuous mode)
      try {
        recognition.start();
      } catch (err) {
        console.log('Recognition restart failed:', err);
        stopDictation();
      }
    }
  };
  
  // Handle speech recognition start
  recognition.onstart = function() {
    $('#speechStatus').text('Listening...');
  };
  
} else {
  // Browser doesn't support speech recognition
  $('#microphoneBtn').prop('disabled', true);
  $('#speechStatus').text('Speech recognition not supported in this browser');
}

// Microphone button click handler
$('#microphoneBtn').click(function() {
  if (!recognition) {
    alert('Speech recognition is not supported in this browser.');
    return;
  }
  
  if (isListening) {
    stopDictation();
  } else {
    startDictation();
  }
});

function startDictation() {
  try {
    recognition.start();
    isListening = true;
    
    // Update button appearance
    $('#microphoneBtn').removeClass('btn-outline-danger').addClass('btn-danger');
    $('#micIcon').text('🔴');
    $('#micText').text('Stop Dictation');
    $('#speechStatus').text('Starting...');
    
  } catch (err) {
    console.error('Failed to start recognition:', err);
    $('#speechStatus').text('Failed to start microphone');
  }
}

function stopDictation() {
  if (recognition) {
    recognition.stop();
  }
  isListening = false;
  
  // Update button appearance
  $('#microphoneBtn').removeClass('btn-danger').addClass('btn-outline-danger');
  $('#micIcon').text('🎤');
  $('#micText').text('Start Dictation');
  $('#speechStatus').text('');
}

});
