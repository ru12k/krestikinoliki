window.addEventListener('load', () => {
  let socket = new WebSocket('ws://xo.t.javascript.ninja/games');
  const urlGameReady = 'http://xo.t.javascript.ninja/gameReady';
  const urlNewGame = 'http://xo.t.javascript.ninja/newGame';
  const urlMove = 'http://xo.t.javascript.ninja/move';
  const urlSurrender = 'http://xo.t.javascript.ninja/surrender';
  let myID = null;
  let GAMEID = null;
  let PLAYERID = null;
  let myTurn = null;
  let endGame = false;
  let inGame = false;
  let register = { register: ''};
  let sideOne = null;
  let sideTwo = null;
  let gameList = document.querySelector('.games-list');
  let btn = document.querySelector('.create-btn');
  let gField = document.querySelector('.game-field');
  let messageField = document.querySelector('.message-field');
  function onclickBtnSurrender() {
    if (!endGame) {
      fetch(urlSurrender, {
        method: 'PUT',
        headers: {
          'Game-ID': GAMEID,
          'Player-ID': PLAYERID,
        }
      })
        .then(response => {
          if (response.status === 200) {
            gField.style.display = 'none';
            gameList.style.display = 'block';
            endGame = `${sideTwo}-ик победил. ${sideOne}-ик сдался`;
            onEndGame(endGame);
          }
        })
        .catch( error => {
          if (error.hasOwnProperty('message')) {
            showMessage(error.message);
            endGame = error.message;
          } else {
            showMessage('Неизветсная ошибка');
            endGame = 'Неизветсная ошибка';
          }
          onEndGame(endGame);
        });
    } else {
      setBtn(false, 'Новая игра');
    }
  }
  function onclickBtnNewGame() {
    fetch(urlNewGame, {
      method: 'POST'
    })
      .then( response => {
        if (response.ok) return response.json();
      })
      .then( data => {
        setBtn(true);
        gameList.style.display = 'block';
        gField.style.display = 'none';
        myID = data;
        register.register = myID.yourId;
        socket.send(JSON.stringify(register));
      })
      .catch(() => {
        showMessage('Ошибка создания игры');
        setBtn(false);
      });
  }
  function onclickCell(e) {
    let elem = e.target;
    if ( myTurn === true && elem.dataset.isturn === 'false' && endGame === false) {
      fetch(urlMove, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Game-ID': GAMEID,
          'Player-ID': PLAYERID,
        },
        body: JSON.stringify({ move: elem.dataset.cell }),
      })
        .then( response => {
          if (response.status === 200 || response.status === 401) return response.json();
          else throw new Error(response.status);
        })
        .then( data => {
          if (data.hasOwnProperty('win')) {
            endGame = data.win;
            moveTurn(elem, sideOne);
            gameList.style.display = 'block';
            onEndGame(endGame);
          } else {
            myTurn = false;
            moveTurn(elem, sideOne);
            showMessage('Ход вашего соперника...');
            doOtherTurn();
          }
        })
        .catch( (response) => {
          endGame = response;
          onEndGame(endGame);
        });
    }
  }
  function onclickGameList(event) {
    let elem = event.target;
    if (elem.tagName === 'LI') {
      setBtn(true);
      register.register = elem.textContent;
      socket.send(JSON.stringify(register));
    }
  }
  function onclickBtn() {
    if (btn.textContent === 'Сдаться') {
      onclickBtnSurrender();
    } else {
      onclickBtnNewGame();
    }
  }
  function createGameField() {
    for (let i = 1; i <= 100; i++) {
      let cell = document.createElement('div');
      cell.dataset.cell = i;
      cell.dataset.isturn = false;
      gField.appendChild(cell);
    }
  }
  function setBtn( disabled = false, text = 'Создать игру') {
    btn.textContent = text;
    btn.disabled = disabled;
  }
  function showGameList(gameName) {
    let li = document.createElement('li');
    li.textContent = gameName;
    li.dataset.gameid = gameName;
    gameList.appendChild(li);
  }
  function showMessage(message) {
    messageField.textContent = message;
  }
  function onEndGame(message) {
    console.log('endgame:', endGame);
    inGame = false;
    setBtn(false, 'Новая игра');
    showMessage(message);
    gField.removeEventListener('click', onclickCell);

  }
  function clearGame() {
    let cells = document.querySelectorAll(`.game-field div[data-isturn = "true"]`);
    if (cells) {
      Array.from(cells).forEach((cell) => {
        cell.textContent = '';
        cell.dataset.isturn = false;
      });
    }
  }
  function onAddGame({id}) {
    GAMEID = id;
    showGameList(GAMEID);
  }
  function onRemoveGame({id}) {
    console.log('remove');
    let game = document.querySelector(`li[data-gameid = "${id}"]`);
    gameList.removeChild(game);
    if (!inGame) {
      console.log(inGame);
      gameList.style.display = 'block';
    } else {
      console.log(inGame);
      gameList.style.display = 'none';
    }
    showMessage('Игра удалена!');
    gField.removeEventListener('click', onclickCell);
    setBtn(false, 'Новая Игра');
  }
  function onStartGame({id}) {
    console.log('start');
    inGame = true;
    endGame = false;
    clearGame();
    showMessage('Ожидаем начала игры');
    setBtn(true);
    gField.style.display = 'flex';
    gameList.style.display = 'none';
    if (PLAYERID = id) {
      fetch(urlGameReady, {
        method: 'POST',
        headers : { 'Content-Type': 'application/json'},
        body : JSON.stringify({ player: PLAYERID, game: GAMEID})
      })
        .then( response => {
          if (response.ok) return response.json();
          else return response.status;
        })
        .then( data => {
          if (data.hasOwnProperty('side')) {
            setBtn(false, 'Сдаться');
            sideOne = data.side;
            if (sideOne === 'x') {
              sideTwo = 'o';
              myTurn = true;
              showMessage('Ваш ход...');
              doMyTurn();
            } else {
              sideTwo = 'x';
              myTurn = false;
              showMessage('Ход вашего соперника...');
              doOtherTurn();
              doMyTurn();
            }
          }
        })
          .catch( status => {
            if (status === 410) showMessage('Ошибка старта игры: другой игрок не ответил');
            else showMessage('Неизвестная ошибка старта игры');
          });
    }
  }
  function doOtherTurn() {
    if (!myTurn) {
      fetch(urlMove, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Game-ID': GAMEID,
          'Player-ID': PLAYERID
        }
      })
        .then( response => {
          if (response.ok) return response.json();
          else doOtherTurn();
        })
        .then( data => {
          let cell;
          if (data.hasOwnProperty('move')) {
            cell = document.querySelector(`div[data-cell = "${data.move}"]`);
            myTurn = true;
            showMessage('Ваш ход...');
            moveTurn(cell, sideTwo);
          }
          if (data.hasOwnProperty('win')) {
            endGame = data.win;
            gameList.style.display = 'block';
            onEndGame(endGame);
          }
        })
        .then(doOtherTurn)
        .catch( error => {
          showMessage(error);
          doMyTurn();
        });
    }
  }
  function doMyTurn() {
    gField.addEventListener('click', onclickCell);
  }
  function moveTurn(elem, side) {
    elem.textContent = side;
    elem.dataset.isturn = true;
  }
  function onMessage({error}) {
    console.log(error);
    showMessage(error);
  }
  setBtn();
  createGameField();
  btn.addEventListener('click', onclickBtn);
  gameList.addEventListener('click', onclickGameList);
  socket.onopen = () => console.log('connected');
  socket.onclose = () => {
    if (event.wasClean) {
      console.log('соединение закрыто чисто');
    } else {
      console.log('обрыв соединения');
    }
    socket = new WebSocket('ws://xo.t.javascript.ninja/games');
};
  socket.onerror = () => {
    showMessage(error);
    setBtn(false);
    socket = new WebSocket('ws://xo.t.javascript.ninja/games');
  };
  socket.onmessage = (e) => {
    let message = JSON.parse(e.data);
    if (message.action === 'add') onAddGame(message);
    if (message.action === 'startGame') onStartGame(message);
    if (message.error === 'error') onMessage(message);
    if (message.action === 'remove') onRemoveGame(message);
  };
});