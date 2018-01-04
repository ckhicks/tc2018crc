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
  $('#display li').each(function (i, el) {
    var completed = '';
    var month = $(el).find('[name="month"]').val();
    var day = $(el).find('[name="day"]').val();
    if (month !== '' && day !== '') {
      completed = month + '-' + day;
    }
    list.push({
      "category": $(el).find('.category').text(),
      "title": $(el).find('[name="title"]').val(),
      "completed": completed,
      "tier": $(el).attr('data-tier')
    });
  });
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
  // build the list
  $.each(list, function (i, obj) {
    var month = '';
    var day = '';
    var completed = '';
    if (!!obj.completed) {
      month = obj.completed.split('-')[0];
      day = obj.completed.split('-')[1];
      completed = 'checked';
    }
    render += '<li data-tier="' + obj.tier + '">';
    render += '<span class="category">' + obj.category + '</span>';
    render += '<input type="checkbox" name="' + i + '" ' + completed + '>';
    render += '<input type="text" name="title" value="' + obj.title + '">';
    render += '<span class="completed">';
    render += '<input type="number" name="month" min="1" max="12" value="' + month + '" placeholder="mm">';
    render += '<input type="number" name="day" min="1" max="31" value="' + day + '" placeholder="dd">';
    render += '<input type="number" name="year" value="2018" disabled>';
    render += '</span>';
    render += '</li>';
  });
  // display the list
  $('#display').html(render);
  $('#list').show();
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
};

//---------------------------------
// login
//---------------------------------
var processLogin = function (creds) {
  var user = window.btoa(app + creds[0] + '||' + creds[1]);
  // store the login
  window.localStorage.setItem('tc2018crc', user);
  // load their book list
  fetchBookList(user);
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
      $('#user').html(username + "'s Reading List").show();
    }
    fetchBookList(user);
  } else {
    // show login and hide list
    $('#auth').show();
    $('#list').hide();
  }
};

//---------------------------------
// on doc ready
//---------------------------------
jQuery(document).ready(function() {
  init();
});