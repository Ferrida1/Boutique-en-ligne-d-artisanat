// admin.js : graphiques du tableau de bord (fetch sur /api/statistiques)
// et confirmation avant l'annulation d'une commande.
(function () {
  "use strict";

  // Dessine des barres horizontales en HTML/CSS (sans bibliothèque).
  function barres(idZone, lignes, formatteur) {
    var zone = document.getElementById(idZone);
    if (!zone) { return; }
    zone.textContent = "";
    if (lignes.length === 0) { zone.textContent = "Aucune donnée."; return; }
    var max = Math.max.apply(null, lignes.map(function (l) { return l.valeur; })) || 1;
    lignes.forEach(function (l) {
      var rangee = document.createElement("div");
      rangee.className = "barre-rangee";
      var nom = document.createElement("span");
      nom.className = "barre-nom"; nom.textContent = l.nom;
      var piste = document.createElement("span");
      piste.className = "barre-piste";
      var barre = document.createElement("span");
      barre.className = "barre"; barre.style.width = Math.round(l.valeur / max * 100) + "%";
      piste.appendChild(barre);
      var val = document.createElement("span");
      val.className = "barre-valeur"; val.textContent = formatteur(l.valeur);
      rangee.appendChild(nom); rangee.appendChild(piste); rangee.appendChild(val);
      zone.appendChild(rangee);
    });
  }

  function fcfa(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA"; }

  if (document.getElementById("graph-ca")) {
    fetch("/api/statistiques")
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
      .then(function (d) {
        barres("graph-ca", d.chiffre_affaires_par_mois.map(function (x) { return { nom: x.mois, valeur: x.chiffre_affaires }; }), fcfa);
        barres("graph-top", d.top_produits.map(function (x) { return { nom: x.nom, valeur: x.quantite }; }), function (n) { return n + " unités"; });
        var noms = { livraison: "À la livraison", mobile_money: "Mobile money" };
        barres("graph-paiement", d.modes_paiement.map(function (x) { return { nom: noms[x.mode_paiement] || x.mode_paiement, valeur: x.nombre }; }), function (n) { return n + " commandes"; });
      })
      .catch(function () {
        ["graph-ca", "graph-top", "graph-paiement"].forEach(function (id) {
          document.getElementById(id).textContent = "Statistiques indisponibles.";
        });
      });
  }

  // Confirmation avant d'annuler une commande
  var bouton = document.querySelector("[data-confirmer-annulation]");
  if (bouton) {
    bouton.form.addEventListener("submit", function (e) {
      if (bouton.form.statut.value === "annulee" &&
          !window.confirm("Annuler cette commande ? Les quantités seront remises en stock.")) {
        e.preventDefault();
      }
    });
  }
})();
