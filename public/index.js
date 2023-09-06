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
 
//Get Names
$.getJSON(
  'http://localhost:4567/patients'
    ,function (response) {
   var newOptionsSelect
   response.forEach((e,i) => {
    newOptionsSelect = newOptionsSelect + '<option value="'+e.dfn+'">'+e.name+ '</option>';
  })
  $('#patientId').append( newOptionsSelect )
})


$('#saveNote').click(function(){

  $.ajax({
    type: "POST",
    url: 'http://localhost:4567/note',
    data: {
      "dfn":$('#patientId').find('option:selected').val(),
      "noteTitle":$('#noteTitleId').find('option:selected').val(),
      "body":$('#noteBody').val().split('\n')
    },
    success: function(data){
      $('#noteBody').val('')
      alert('Thanks!')
      console.log('test')
    },

  });


})

$('#noteTitleId').change(function(){
    var selected = $(this).find('option:selected');
    console.log(selected.val())
  })
$('#patientId').change(function(){
    var selected = $(this).find('option:selected');
    console.log(selected.val())
  })

});
