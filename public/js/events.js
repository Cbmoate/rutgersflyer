/**
 * Created by Ale on 2/23/16.
 */
$(document).ready(function() {
  var holdStarValue;

  $('select').material_select();

  $('.registerButton').on('click',function(){
    $('#registerModal').openModal();
  });

  $('#addlocationbtn').on('click',function() {
    $('#modal2').openModal();
  });

  $(".button-collapse").sideNav();

  $('.loginButton').on('click',function(){
    $('#loginModal').openModal()
  });

  $('.starHover').mouseenter( function(){
    var holdThis = $(this);
    $('.starHover').each(function(){
      if(parseInt($(this).attr('data-star')) <= parseInt($(holdThis).attr('data-star'))){
        $(this).attr('src', '../images/star_full.png')
      }
    });

  } ).mouseleave( function(){
    $('.starHover').each(function(){
      if(parseInt($('.starHover').attr('data-star')) <= parseInt($(this).attr('data-star'))){
        $(this).attr('src', '../images/star_empty.png')
      }
    });

  }).click(function(){

    $('#starRatingInput').attr('value', parseInt($(this).attr('data-star')))
    $('.starHover').off()

  });

});
