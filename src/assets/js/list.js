// on récupère les outils dont on va se servir
import card from './card.js';
import { baseUrl } from './config.js';

// objet qui contient tout ce qui est lié à l'utilisation des listes
const list = {
  // propriété pour mémoriser l'élement correspondant à la modale
  addModal: document.getElementById('addListModal'),
  // méthode pour amorcer la création les listes et les cartes initialement
  init: async function() {
    // on cible le conteneur des listes
    const parent = document.querySelector('.card-lists');
    // on initialise le drag n drop des enfant de ce conteneur : les listes


    // on récupère les listes en BDD
    const lists = await list.getAll();
    // pour chaque ensemble de données d'une liste
    for (const listData of lists) {
      // on crée une liste dans le DOM
      list.makeInDOM(listData.name, listData.id);
      // pour chaque card de la liste
      for (const cardData of listData.cards) {
        // on crée une carte dans le dom
        card.makeInDOM(cardData);
      }
    }
  },
  // méthode dire quoi faire quand on dépose une liste après un drag n drop
  handleDragEnd: async function() {
    // on cible toutes les listes
    const lists = document.querySelectorAll('.panel');
    // on va compter l'ordre des listes
    let index = 0;
    // pour chaque liste
    for (const listElement of lists) {
      // on récupère son id
      const id = listElement.dataset.listId;
      // on crée un ensemble de données qu'on enverra à l'api
      const data = new FormData();
      // on ajoute une paire clé: valeur correspondant à la position de la liste
      data.append('position', index);
      // on compte l'ordre des listes
      index++;
      // on va essayer de contacter l'api
      try {
        // on appelle l'api pour modifier la position de la liste
        const response = await fetch(`${baseUrl}/lists/${id}`, {
          method: 'PATCH',
          body: data,
        });
        // on récupère la réponse
        const body = await response.json();
        // si ça n'est pas bon
        if (!response.ok) {
          // on jète un erreur pour sauter dans le catch
          throw new Error(body.message);
        }
      }
      // si on attrape une erreur on va prévénir qu'il y a une erreur 
      catch (error) {
        alert('Erreur de récupération');
        console.error(error);
      }
    }
  },
  // méthode pour poser les écouteurs initiaux
  addListenerToActions: function() {
    // Ouverture de la modale au clic sur le bouton
    const addListButton = document.getElementById('addListButton');
    addListButton.addEventListener('click', list.showAddModal);

    // Fermeture au clic sur les boutons
    const closeButtons = list.addModal.querySelectorAll('.close');
    // for (const button of closeButtons) {
    //   button.addEventListener('click', list.hideModal);
    // }
    closeButtons.forEach((button) => {
      button.addEventListener('click', list.hideModal);
    });

    // création d'une liste à la soumission du formulaire
    // la méthode querySelector existe sur le document mais aussi sur un Element pour chercher dans une zone restreinte
    list.form = list.addModal.querySelector('form');
    list.form.addEventListener('submit', list.handleAddForm);
  },
  // méthode pour afficher la modale
  showAddModal: function() {
    list.addModal.classList.add('is-active');
  },
  // méthode pour cacher la modale
  hideModal: function() {
    list.addModal.classList.remove('is-active');
  },
  // méthode pour dire quoi faire au submit du form d'ajout
  handleAddForm: async function(event) {
    event.preventDefault();
    // on construit un objet contenant toutes les données du formulaires
    const formData = new FormData(event.currentTarget);
    const lists = document.querySelectorAll('.panel');
    // on ajoute une info représentant la position de la nouvelle liste
    formData.append('position', lists.length + 1);
    console.log(Object.fromEntries(formData.entries()))
    // j'appelle la méthode qui va s'occuper d'appeler l'api pour faire persister la nouvelle liste en fonction des données saisies dans le formulaire
    const newList = await list.save(Object.fromEntries(formData.entries()));
    list.makeInDOM(newList.name, newList.id);
  },
  // méthode pour construire la liste dans le DOM
  makeInDOM: function(name, id) {
    // On cible le template
    const template = document.querySelector("#list-template");

    // On clone le contenu du template
    const clone = document.importNode(template.content, true);

    // On reconfigure la copie
    const title = clone.querySelector('h2');
    title.textContent = name;

    // on pose un écouteur pour gérer l'ouverte du formulaire d'édition au double clic
    title.addEventListener('dblclick', list.showEditFrom);

    // on cible le formulaire à côté du titre
    const editForm = title.nextElementSibling;
    // pour gérer l'édition à sa soumission
    editForm.addEventListener('submit', list.edit);

    // on mémorise l'id de la liste dans un champ caché du formulaire d'édition
    const inputId = editForm.querySelector('input');
    inputId.value = id;

    // on cible la div du clone qui possède l'attribut portant l'id
    const panel = clone.querySelector('.panel');
    // on reconfigure cet attribut pour mémoriser l'id de la liste qui resservira plus tard, notamment pour l'ajout des cartes
    panel.setAttribute('data-list-id', id);
    // attention il faut bien rajouter un ecouteur sur le bouton de chaque nouvelle liste
    const button = clone.querySelector('.add-card');
    button.addEventListener('click', card.showAddModal);

    // au clic sur la poubelle de la liste on la supprimera
    clone.querySelector('.remove-list').addEventListener('click', list.delete);

    // on cible le conteneur des cartes
    const parent = clone.querySelector('.panel-block');
    // et on active le drag n drop sur les cartes


    // On insère la copie avant le voisin déjà présent
    const addColumn = document.getElementById('add-column');
    addColumn.before(clone);

    // on ferme la modal d'ajout et on vide le formulaire d'ajout
    list.hideModal();
    list.resetForm();
  },
  // méthode pour vider les champs du formulaire
  resetForm: function() {
    list.form.reset();
  },
  // méthode qui retourne les listes récupérées depuis l'api
  getAll: async function() {
    try {
      // on interroge l'api (par défaut en get)
      const response = await fetch(`${baseUrl}/lists`);
      // on parse le texte json de la réponse pour obtenir une valeur js
      const body = await response.json();
      // si tout va bien on retourne le contenu de la réponse
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
  // méthode qui envoie les infos d'une nouvelle liste à l'api pour qu'elle soit ajoutée en BDD, et qui retourne la réponse du serveur (les infos de la nouvelle liste)
  save: async function(data) {
    try {

      // je fais un fetch avec des options pour choisir la méthode post et le corps de la requete, ici les données du paramètre
      const response = await fetch(`${baseUrl}/lists`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
      });
      const body = await response.json();
      if (response.ok) {
        return body;
      }
      else {
        throw new Error(body.error);
      }
    }
    catch (error) {
      alert('Erreur de récupération');
      console.error(error);
    }
  },
  // méthode pour affiche le formulaire d'édition
  showEditFrom: function(event) {
    // on cible le titre qui a été double cliqué
    const title = event.currentTarget;
    // et son voisin qui est le formulaire
    const form = title.nextElementSibling;
    // on masque le titre
    title.classList.add('is-hidden');
    // on montre le form
    form.classList.remove('is-hidden');
  },
  // méthode qui va appeler l'api pour sauvegarder une modification ET qui modifie le DOM en fonction des nouvelles infos de la liste
  edit: async function(event) {
    event.preventDefault();
    // on récupère le form qui a été soumis
    const form = event.currentTarget;
    // et son voisin precedent : le titre
    const title = form.previousElementSibling;
    // on crée un ensemble de données avec les infos du form
    const data = new FormData(event.currentTarget);
    // on recupère la valeur du champ nommé id
    const id = data.get('id');
    try {
      // on appelle l'api pour enregistrer la mise à jour
      const response = await fetch(`${baseUrl}/lists/${id}`, {
        method: 'PATCH',
        body: data,
      });
      const body = await response.json();
      if (response.ok) {
        // si tout s'est bien passé on modifie le DOM
        title.textContent = body.name;
        title.classList.remove('is-hidden');
        form.classList.add('is-hidden');
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
  // méthode qui va appeler l'api pour supprimer une liste en BDD ET qui modifie le DOM pour faire disparaitre la liste
  delete: async function(event) {
    event.preventDefault();
    // la liste est le parent panel de la poubelle qui a été cliqué
    const list = event.target.closest('.panel');
    // on recupère son id via l'attribut data-list-id dispo via dataset
    const id = list.dataset.listId;
    try {
      // on appelle l'api
      const response = await fetch(`${baseUrl}/lists/${id}`, {
        method: 'DELETE',
      });
      const body = await response.json();
      if (response.ok) {
        // si tout roule on enlève la liste du DOM
        list.remove();
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

export default list;