// commande.js : page du panier.
// 1) charge les prix via fetch sur /api/produits, 2) recalcule le total en direct,
// 3) vérifie le formulaire avant l'envoi (le serveur revérifie tout de toute façon).
(function () {
  "use strict";
  var corps = document.getElementById("lignes-panier");
  var zoneContenu = document.getElementById("panier-contenu");
  var zoneVide = document.getElementById("panier-vide");
  var totalCase = document.getElementById("total-panier");
  var champPanier = document.getElementById("champ-panier");
  var form = document.getElementById("form-commande");
  var produits = {}; // id -> {nom, prix, stock}

  function fcfa(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
  }

  function cellule(texte, etiquette) {
    var td = document.createElement("td");
    td.textContent = texte;
    if (etiquette) { td.setAttribute("data-label", etiquette); } // affichée sur téléphone
    return td;
  }

  // Recalcule les sous-totaux et le total à partir du panier et des prix reçus de l'API.
  function afficher() {
    var panier = window.Panier.lire();
    var ids = Object.keys(panier).filter(function (id) { return produits[id]; });
    // On retire du panier les produits devenus indisponibles
    var nettoye = {};
    ids.forEach(function (id) { nettoye[id] = panier[id]; });
    if (Object.keys(nettoye).length !== Object.keys(panier).length) { window.Panier.ecrire(nettoye); }

    zoneVide.hidden = ids.length > 0;
    zoneContenu.hidden = ids.length === 0;
    corps.textContent = "";
    var total = 0;

    ids.forEach(function (id) {
      var p = produits[id];
      var qte = Math.max(1, Math.min(Number(nettoye[id]) || 1, p.stock));
      total += qte * p.prix;

      var tr = document.createElement("tr");
      tr.appendChild(cellule(p.nom));
      tr.appendChild(cellule(fcfa(p.prix), "Prix"));

      var tdQ = document.createElement("td");
      tdQ.setAttribute("data-label", "Quantité");
      var label = document.createElement("label");
      label.className = "sr-only";
      label.setAttribute("for", "qte-" + id);
      label.textContent = "Quantité de " + p.nom;
      var input = document.createElement("input");
      input.type = "number"; input.id = "qte-" + id;
      input.min = "1"; input.max = String(p.stock); input.value = String(qte);
      input.className = "quantite";
      input.addEventListener("change", function () {
        var v = parseInt(input.value, 10);
        if (isNaN(v) || v < 1) { v = 1; }
        if (v > p.stock) { v = p.stock; }
        var pan = window.Panier.lire();
        pan[id] = v;
        window.Panier.ecrire(pan);
        afficher();
      });
      tdQ.appendChild(label); tdQ.appendChild(input);
      tr.appendChild(tdQ);

      tr.appendChild(cellule(fcfa(qte * p.prix), "Sous-total"));

      var tdR = document.createElement("td");
      var retirer = document.createElement("button");
      retirer.type = "button"; retirer.className = "lien-bouton";
      retirer.textContent = "Retirer";
      retirer.addEventListener("click", function () {
        var pan = window.Panier.lire();
        delete pan[id];
        window.Panier.ecrire(pan);
        afficher();
      });
      tdR.appendChild(retirer);
      tr.appendChild(tdR);
      corps.appendChild(tr);
      nettoye[id] = qte;
    });

    totalCase.textContent = fcfa(total);
    champPanier.value = JSON.stringify(nettoye); // seules les quantités partent au serveur
  }

  // Charge les produits du panier depuis l'API JSON.
  function charger() {
    var ids = Object.keys(window.Panier.lire());
    if (ids.length === 0) { afficher(); return; }
    fetch("/api/produits?ids=" + encodeURIComponent(ids.join(",")))
      .then(function (r) {
        if (!r.ok) { throw new Error("Réponse " + r.status); }
        return r.json();
      })
      .then(function (liste) {
        liste.forEach(function (p) { produits[String(p.id)] = p; });
        afficher();
      })
      .catch(function () {
        zoneVide.hidden = false;
        zoneVide.textContent = "Impossible de charger le panier. Réessayez plus tard.";
      });
  }

  // Vérification du formulaire avant l'envoi.
  function erreur(champ, message) {
    document.getElementById("err-" + champ).textContent = message;
    document.getElementById(champ).setAttribute("aria-invalid", message ? "true" : "false");
    return message === "";
  }

  form.addEventListener("submit", function (e) {
    var nom = form.nom.value.trim();
    var tel = form.telephone.value.replace(/\s/g, "");
    var adresse = form.adresse.value.trim();
    var ok = true;
    ok = erreur("nom", nom.length >= 3 ? "" : "Entrez votre nom complet (3 caractères minimum).") && ok;
    ok = erreur("telephone", /^6\d{8}$/.test(tel) ? "" : "Téléphone invalide : 9 chiffres, commence par 6.") && ok;
    ok = erreur("adresse", adresse.length >= 5 ? "" : "Entrez une adresse de livraison (5 caractères minimum).") && ok;
    if (champPanier.value === "{}") { ok = false; }
    if (!ok) { e.preventDefault(); }
  });

  charger();
})();
