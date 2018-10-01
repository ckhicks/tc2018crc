//---------------------------------
// config
//---------------------------------
var app = 'tc2018crc';
var mlabApiKey = 'HkdcUgl-Du1smCcAb58FX0-WQ7VkyBzR';
var bookTiers = [
  {
    "name": "Light",
    "description": "1 Book Every 4 Weeks"
  },
  {
    "name": "Avid",
    "description": "1 Book Every 2 Weeks"
  },
  {
    "name": "Committed",
    "description": "1 Book Every Week"
  },
  {
    "name": "Obsessed",
    "description": "2 Books Every Week"
  }
];
var bookList = [];

//---------------------------------
// interacting with the book list
//---------------------------------
var editBookList = function (user, newUser = false) {
  var list = [];
  var total = 0;
  $('#display li[data-tier]').each(function (i, el) {
    var title = $(el).find('[name="title"]').val();
    var completed = '';
    var date = $(el).find('[name="date"]').val();
    if (title !== '' && date !== '') {
      completed = date;
      total++;
    }
    list.push({
      "category": $(el).find('.category').text(),
      "title": title,
      "completed": completed,
      "tier": $(el).attr('data-tier')
    });
  });
  $('#total strong').html(total);
  // see if they already have an account
  if (!newUser) {
    $.ajax({
      url: 'https://api.mlab.com/api/1/databases/tc2018crc/collections/users?q={"id":"' + user + '"}&apiKey=' + mlabApiKey,
      data: JSON.stringify({
        "id": user,
        "list": list
      }),
      type: "PUT",
      contentType: "application/json"
    });
  } else {
    $.ajax({
      url: 'https://api.mlab.com/api/1/databases/tc2018crc/collections/users?q={"id":"' + user + '"}&apiKey=' + mlabApiKey,
      data: JSON.stringify({
        "id": user,
        "list": list
      }),
      type: "POST",
      contentType: "application/json"
    });
  }
};

//---------------------------------
// build book list
//---------------------------------
var buildBookList = function (list) {
  var render = '';
  var tier = 0;
  var total = 0;
  // build the list
  $.each(list, function (i, obj) {
    if (obj.tier > tier) {
      render += '<li class="heading">';
      render += '<h2>The ' + bookTiers[tier].name + ' Reader</h2>';
      render += '<h3>(' + bookTiers[tier].description + ')</h3>';
      render += '</li>';
      tier++;
    }
    var date = '';
    var completed = '';
    if (!!obj.completed) {
      date = obj.completed;
      completed = 'checked';
      total++;
    }
    render += '<li data-tier="' + obj.tier + '">';
    render += '<span class="category">' + obj.category + '</span>';
    render += '<input type="checkbox" name="' + i + '" ' + completed + '>';
    render += '<input type="text" name="title" value="' + obj.title + '">';
    render += '<span class="completed"><input type="text" name="date" value="' + date + '"></span>';
    render += '</li>';
  });
  // add to dom
  $('#display').html(render);
  // enable datepickers
  $('input[name="date"]').datepicker({
    format: 'mm-dd',
    autoclose: true
  });
  // display the list
  $('#list').show();
  // update the total
  $('#total strong').html(total);
};

//---------------------------------
// fetch book list
//---------------------------------
var fetchBookList = function (user) {
  var getUserList = function () {
    return new Promise(function (resolve, reject) {
      // does this user have a list?
      $.get('https://api.mlab.com/api/1/databases/tc2018crc/collections/users?q={"id":"' + user + '"}&apiKey=' + mlabApiKey, function (res) {
        if (res.length > 0) {
          bookList = res[0].list;
          buildBookList(bookList);
        } else {
          bookList = window.list;
          buildBookList(bookList);
          editBookList(user, true);
        }
      });
    });
  }
  // is this a new user?
  if (!!user) {
    getUserList().then(function (bookList) {
      buildBookList(bookList);
      editBookList(user, true);
    });
  }
  // body class
  $('body').addClass('user');
};

//---------------------------------
// login
//---------------------------------
var processLogin = function (creds) {
  var user = window.btoa(app + creds[0] + '||' + creds[1]);
  // store the login
  window.localStorage.setItem('tc2018crc', user);
  // reload and fetch their book list
  location.reload();
};

//---------------------------------
// logout
//---------------------------------
var logoutUser = function () {
  window.localStorage.removeItem('tc2018crc');
};

//---------------------------------
// app init
//---------------------------------
var init = function () {

  // process login attempts
  $('#login').on('submit', function (e) {
    e.preventDefault();
    var email = $('#login').find('[name="email"]').val();
    var name = $('#login').find('[name="name"]').val();
    if (!!email && !!name) {
      email = email.toLowerCase();
      name = name.toLowerCase();
      processLogin([email, name]);
    }
  });

  // making edits to the list
  $(document).on('change', '#display input', function () {
    var user = window.localStorage.getItem('tc2018crc');
    editBookList(user);
  });

  // check for existing creds
  var user = window.localStorage.getItem('tc2018crc');
  if (!!user) {
    var username = window.atob(user).slice(9).split('||')[1];
    // fetch list and hide login
    $('#auth').hide();
    if (username !== '') {
      username = username.charAt(0).toUpperCase() + username.slice(1);
      $('#user').html(username + "'s Reading List").show();
      $('#logout').show();
    }
    fetchBookList(user);
  } else {
    // show login and hide list
    $('#auth').show();
    $('#list').hide();
    $('#logout').hide();
  }

  $('#logout').on('click', function (e) {
    e.preventDefault();
    logoutUser();
    location.reload();
  });
};

//---------------------------------
// on doc ready
//---------------------------------
jQuery(document).ready(function() {
  init();
});
