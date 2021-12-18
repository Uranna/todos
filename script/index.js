import '../styles/styles.scss';
import { test as todos } from '../data.json';
import { v4 as uuidv4 } from 'uuid';

const URL = "http://localhost:3000/todos";
const $element = document.querySelector('.task-list__list');
const $form = document.getElementById('form');

if (!localStorage.getItem('status')) {
  localStorage.setItem('status', 'false')
  console.log('локальное хранилище')
}

let statusDB = localStorage.getItem('status');
console.log(statusDB);

if (!statusDB) {
  getDataLocal();
  buttonEvent();

}
else {
  getDataServer();
  buttonEvent();
  document.querySelector('.task-management__checkbox').checked = true;
}


function getDataLocal() {
  let json = JSON.parse(localStorage.getItem('data'))
  json = (json.length !== 0 && json) ? json : [...todos];

  const data = json.map(item => createTask(item));
  $element.innerHTML = data.join(' ');

  localStorage.setItem('data', JSON.stringify(json))
}

function getDataServer() {
  fetch(URL)
    .then(response => response.json())
    .catch(e => {
      console.log('Ошибка подключения к серверу. Используйте локальное хранилище');
    })
    .then(json => {
      if (!json) {
        json = [];
      }
      const data = json.map(item => createTask(item));
      $element.innerHTML = data.join(' ');
    })
    .then(() => {
      buttonEvent();
    })
}

document.querySelector('.task-management__checkbox').addEventListener('change', (e) => {
  statusDB = e.target.checked;
  if (!statusDB) {
    console.log('локальное хранилище');
    getDataLocal();
    buttonEvent();
  }
  else {
    console.log('сервер')
    getDataServer();
  }
  localStorage.setItem('status', e.target.checked)
})

function buttonEvent() {
  const button = document.getElementsByClassName('task-list__remove-task');
  [...button].forEach((item) => {
    item.addEventListener('click', deleteTask)
  })

  const checkbox = document.getElementsByClassName('task-list__ready-task');
  [...checkbox].forEach(item => {
    item.addEventListener('change', changeStatusTask)
  })
}

////====УДАЛИТЬ ВСЕ ЗАДАЧИ
const deleteAll = document.querySelector('.task-management__remove-all');

deleteAll.addEventListener('click', () => {
  if (!statusDB) {
    localStorage.setItem('data', '[]');
    document.querySelectorAll('.task-list__list').innerHTML = '';
  }
  else {
    fetch(URL)
      .then(response => response.json())
      .then(json => json.map(item => { return item.id }))
      .then(data => data.forEach(item => {
        fetch(`${URL}/${item}`, {
          method: 'DELETE'
        })
      }))
  }
})


////====ВЫПОЛНИТЬ ВСЕ ЗАДАЧИ
const readyAll = document.querySelector('.task-management__ready-all');
readyAll.addEventListener('click', () => {
  if (!statusDB) {
    let data = JSON.parse(localStorage.getItem('data'));
    data = data.map(item => {
      return { ...item, done: true }
    })
    localStorage.setItem('data', JSON.stringify(data));
    data = data.map(item => createTask(item));
    $element.innerHTML = data.join(' ');
    buttonEvent();
  }
  else {
    fetch(URL)
      .then(response => response.json())
      .then(json => json.map(item => { return item.id }))
      .then(data => data.forEach(item => {
        fetch(`${URL}/${item}`, {
          method: 'PATCH',
          body: JSON.stringify({ done: true }),
          headers: { 'Content-Type': 'application/json' }
        })
      }))
  }
})


function createTask(item) {
  return `
    <li class="task-list__item ${item.done ? 'task-list__item--done' : ''}" id=${item.id} >
      <div class="task-list__info">
        <p class="task-list__text">${item.text}</p>
        <div class="task-list__button">
          <input type="checkbox" name="status" id="readyButton_${item.id}" class="task-list__ready-task" ${(item.done ? "checked" : "")}>
          <label for="readyButton_${item.id}" class="task-list__checkbox button"></label>
          <button class="task-list__remove-task button">Remove</button>
        </div>
      </div>
      <div class="task-list__box-status">
        <div class="task-list__status"></div>
      </div>
    </li>
    `
}

//====УДАЛЕНИЕ ЗАДАЧИ
function deleteTask(e) {
  const parent = e.target.closest('.task-list__item');
  if (!statusDB) {
    console.log('Удалить одно локально');

    localStorage.setItem('data', JSON.stringify(JSON.parse(localStorage.getItem('data')).filter(item => item.id.toString() !== parent.id)));
    document.querySelector('.task-list__list').removeChild(parent);

  }
  else {
    fetch(`${URL}/${parent.id}`, {
      method: 'DELETE'
    })
  }
}

//====ИЗМЕНЕНИЯ СТАТУСА ЗАДАЧИ
function changeStatusTask(e) {
  const parent = e.target.closest('.task-list__item');
  if (!statusDB) {
    let data = JSON.parse(localStorage.getItem('data'))
    data = data.map(item => {
      if ((item.id).toString() === parent.id) {
        return { ...item, done: e.target.checked }
      }
      else return item
    })
    localStorage.setItem('data', JSON.stringify(data));



    if (e.target.checked) {
      parent.classList.add('task-list__item--done');
    }
    else parent.classList.remove('task-list__item--done');
  }
  else {
    fetch(`${URL}/${parent.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ "done": e.target.checked }),
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

//====ДОБАВЛЕНИЕ НОВОЙ ЗАДАЧИ
$form.addEventListener('submit', addTask);

function addTask(e) {
  e.preventDefault();
  let formData = new FormData($form);
  if (formData.get('text').length !== 0) {

    if (!statusDB) {
      let newTask = {
        id: uuidv4(),
        text: formData.get('text'),
        done: false
      };
      localStorage.setItem('data', JSON.stringify([...JSON.parse(localStorage.getItem('data')), newTask]));
      $element.innerHTML += createTask(newTask);
      $form.reset();
      buttonEvent();
    }
    else {
      fetch(URL, {
        method: 'POST',
        body: JSON.stringify({ text: formData.get('text'), done: false }),
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  else {
    $form.querySelector('.task-management__input').classList.add('task-management__input--error');
  }
}

//====СТИЛИ ДЛЯ ВАЛИДАЦИИ ИНПУТА
$form.querySelector('.task-management__input').onclick = () => {
  if ($form.querySelector('.task-management__input').classList.contains('task-management__input--error')) {
    $form.querySelector('.task-management__input--error').classList.remove('task-management__input--error');
  }
}
