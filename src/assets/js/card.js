
import { baseUrl } from "./config.js";

const card = {
  addModal: document.getElementById('addCardModal'),
  addListenerToActions: function() {
    // Ouverture de la modale au clic sur les boutons
    const addCardButtons = document.querySelectorAll('.add-card');
    addCardButtons.forEach((button) => {
      button.addEventListener('click', card.showAddModal);
    });
    // // EXemple de délégation
    // document.body.addEventListener('click', (event) => {
    //   if (
    //       event.target.classList.contains('add-card') 
    //       || event.target.closest('.add-card')
    //   ) {
    //     card.showAddModal();
    //   }
    // });

    // Fermeture au clic sur les boutons
    const closeButtons = card.addModal.querySelectorAll('.close');
    closeButtons.forEach((button) => {
      button.addEventListener('click', card.hideModal);
    });


    // création d'une carte à la soumission du formulaire
    card.form = card.addModal.querySelector('form');
    card.form.addEventListener('submit', card.handleAddForm);
  },
  handleDragEnd: async function(event) {
    // on cible les cartes de la liste d'origine
    let cards = event.from.querySelectorAll('.box');
    // de plus si la liste d'origine n'est pas la même que la liste de destrination
    if (event.from !== event.to) {
      // on décrit une liste de carte qui contient
      cards = [
        ...cards, // les cartes de la liste d'origine
        ...event.to.querySelectorAll('.box') // et les cartes de la liste de destination
      ]; // ces ... sont un spread operator : il permet ici de déverser le contenu de tableaux dans un autre tableau
    }
    // on va compter les positions des cartes
    let index = 0;
    // pour chaque carte de la liste
    for (const cardElement of cards) {
      // on récupère son id via les attribut data
      const id = cardElement.dataset.cardId;
      // on récupère le parent qui represente la liste
      const parent = cardElement.closest('.panel');
      // on récupère l'id de la liste
      const listId = parent.dataset.listId;
      // on crée un ensemble de données
      const data = new FormData();
      // avec l'info de la position
      data.append('position', index);
      // et l'info de la liste associée à la carte
      data.append('list_id', listId);
      // on compte la position
      index++;
      try {
        // on appelle l'api pour sauvegarder les nouvelles infos de la liste
        const response = await fetch(`${baseUrl}/cards/${id}`, {
          method: 'PATCH',
          body: data,
        });
        const body = await response.json();
        // on mettra une erreur si tout va mal, si tout va bien, rien à faire Sortable a déjà impacté le DOM pour réordonner les listes
        if (!response.ok) {
          throw new Error(body.message);
        }
      }
      catch (error) {
        alert('Erreur de récupération');
        console.error(error);
      }
    }
  },
  showAddModal: function(event) {
    card.addModal.classList.add('is-active');
    // je pars de currentTarget qui représente l'élement cliqué
    // via closest je cible un ancetre
    const list = event.currentTarget.closest('.panel');
    // les attributs data-qqch présents dans le html sont accessibles dans la propriété dataset en camelCase en JS
    const listId = list.dataset.listId;
    const input = document.getElementById('list-id-hidden');
    input.value = listId;
  },
  hideModal: function() {
    card.addModal.classList.remove('is-active');
  },
  handleAddForm: async function(event) {
    event.preventDefault();
    // on construit un objet contenant toutes les données du formulaires
    const formData = new FormData(card.form);
    // on convertit notre objet FormData en objet simple
    // pratique ici pour passer toutes les infos du formulaire en une fois via un argument
    const cardData = await card.save(formData);
    card.makeInDOM(cardData);
  },
  makeInDOM: function(data) {
    const template = document.querySelector("#card-template");
    const clone = document.importNode(template.content, true);
    const title = clone.querySelector('.card-title h3');
    title.textContent = data.title;

    clone.querySelector('.edit-btn').addEventListener('click', card.showEditFrom);
    
    const editForm = title.nextElementSibling;
    editForm.addEventListener('submit', card.edit);
    const inputs = editForm.querySelectorAll('input');

    const inputId = inputs[0];
    inputId.value = data.id;

    inputs[1].value = data.title;
    inputs[2].value = data.color;
    const cardElement = clone.querySelector('.box');
    cardElement.setAttribute('data-card-id', data.id);
    cardElement.style.boxShadow = `0 2px 3px ${data.color}`;

    clone.querySelector('.remove-btn').addEventListener('click', card.delete);
    const parent = document.querySelector(`.panel[data-list-id="${data.list_id}"] .panel-block`);
    parent.appendChild(clone);

    card.hideModal();
    card.resetForm();
  },
  resetForm: function() {
    card.form.reset();
  },
  save: async function(data) {
    try {
      const response = await fetch(`${baseUrl}/cards`, {
        method: 'POST',
        body: data,
      });
      const body = await response.json();
      if (response.ok) {
        return body;
      }
      else {
        throw new Error(body.message);
      }
    }
    catch (error) {
      alert('Erreur de récupération');
      console.error(error);
    }
  },
  showEditFrom: function(event) {
    event.preventDefault();
    const card = event.target.closest('.box');
    const title = card.querySelector('h3');
    const form = card.querySelector('form');
    const inputs = form.querySelectorAll('input');
    title.classList.add('is-hidden');
    form.classList.remove('is-hidden');
    inputs[1].select();
  },
  edit: async function(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.previousElementSibling;
    const data = new FormData(event.currentTarget);
    const cardElement = form.closest('.box');
    const id = data.get('id');
    try {
      const response = await fetch(`${baseUrl}/cards/${id}`, {
        method: 'PATCH',
        body: data,
      });
      const body = await response.json();
      if (response.ok) {
        title.textContent = body.title;
        title.classList.remove('is-hidden');
        form.classList.add('is-hidden');
        cardElement.style.borderColor = body.color;
      }
      else {
        throw new Error(body.message);
      }
    }
    catch (error) {
      alert('Erreur de récupération');
      console.error(error);
    }
  },
  delete: async function(event) {
    event.preventDefault();
    const card = event.target.closest('.box');
    const id = card.dataset.cardId;
    try {
      const response = await fetch(`${baseUrl}/cards/${id}`, {
        method: 'DELETE',
      });
      const body = await response.json();
      if (response.ok) {
        card.remove();
      }
      else {
        throw new Error(body.message);
      }
    }
    catch (error) {
      alert('Erreur de récupération');
      console.error(error);
    }
  },
};

export default card;