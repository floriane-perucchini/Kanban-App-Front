import list from './list.js'
import card from './card.js'

const app = {
  init: function () {
    list.init();
    list.addListenerToActions();
    card.addListenerToActions();
  }
};

document.addEventListener('DOMContentLoaded', app.init);

export default app; 