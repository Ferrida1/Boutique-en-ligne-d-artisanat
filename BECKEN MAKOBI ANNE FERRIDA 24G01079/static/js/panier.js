// panier.js : panier conservé dans le navigateur (localStorage), partagé par toutes les pages.
// Format stocké : {"12": 2, "5": 1}  (identifiant du produit -> quantité).
// Les prix ne sont JAMAIS stockés ici : le serveur les relit dans la base.
(function () {
  "use strict";
  var CLE = "panier_artisanat";

  // Lit le panier ; en cas de données absentes ou corrompues, renvoie un panier vide.
  function lire() {
    try {
      var brut = JSON.parse(localStorage.getItem(CLE) || "{}");
      return brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {};
    } catch (e) {
      return {};
    }
  }

  function ecrire(panier) {
    try {
      localStorage.setItem(CLE, JSON.stringify(panier));
    } catch (e) { /* stockage indisponible : on ignore */ }
    afficherCompteur();
  }

  // Nombre total d'articles, affiché dans le menu.
  function afficherCompteur() {
    var p = lire(), total = 0;
    Object.keys(p).forEach(function (k) { total += Number(p[k]) || 0; });
    var span = document.getElementById("compteur-panier");
    if (span) { span.textContent = total; }
  }

  // Ajoute n exemplaires (1 par défaut) ; la quantité maximale réelle est revérifiée par le serveur.
  function ajouter(id, n) {
    var p = lire();
    p[id] = Math.min((Number(p[id]) || 0) + (n || 1), 99);
    ecrire(p);
  }

  // Notification brève après un ajout.
  var minuteur = null;
  function notifier(texte) {
    var boite = document.getElementById("toast");
    if (!boite) { return; }
    document.getElementById("toast-texte").textContent = texte;
    boite.hidden = false;
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { boite.hidden = true; }, 3500);
    var compteur = document.getElementById("compteur-panier");
    if (compteur) {
      compteur.classList.remove("rebond");
      void compteur.offsetWidth; // relance l'animation
      compteur.classList.add("rebond");
    }
  }

  window.Panier = { lire: lire, ecrire: ecrire, ajouter: ajouter, afficherCompteur: afficherCompteur };

  document.addEventListener("DOMContentLoaded", function () {
    // Après une commande confirmée, on vide le panier du navigateur.
    if (document.querySelector("[data-vider-panier]")) { ecrire({}); }
    afficherCompteur();

    // Boutons « Ajouter au panier »
    document.querySelectorAll("[data-ajout]").forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        var n = 1;
        var idChamp = bouton.getAttribute("data-quantite-champ");
        if (idChamp) {
          var champ = document.getElementById(idChamp);
          n = parseInt(champ.value, 10);
          var max = parseInt(champ.max, 10) || 99;
          if (isNaN(n) || n < 1) { n = 1; }
          if (n > max) { n = max; }
          champ.value = n;
        }
        ajouter(bouton.getAttribute("data-ajout"), n);
        notifier(n > 1 ? n + " articles ajoutés au panier" : "Ajouté au panier");
      });
    });
  });
})();
