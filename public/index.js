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

$('#noteTitleId').change(function(){
    var selected = $(this).find('option:selected');
    console.log(selected.val())
  })

});
