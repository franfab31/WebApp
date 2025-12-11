function Utente(id, username, ruolo, nome, cognome){
    this.id = id;
    this.username = username;
    this.ruolo = ruolo;
    this.nome = nome;
    this.cognome = cognome;
} 

function Task(id, domanda, id_prof, stato, risposta, voto, dimensione_gruppo){
    this.id = id;
    this.domanda = domanda;
    this.id_prof = id_prof;
    this.stato = stato;
    this.risposta = risposta;
    this.voto = voto;
    this.dimensione_gruppo = dimensione_gruppo;
}

function Gruppo(id_task, id_utente){
    this.id_task = id_task;
    this.id_utente = id_utente;
}

export { Utente, Task, Gruppo };