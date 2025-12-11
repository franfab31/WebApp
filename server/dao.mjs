import sqlite from 'sqlite3';
import {Utente, Task, Gruppo } from './UTGModels.mjs';
import crypto from 'crypto';



const db = new sqlite.Database("compitidb.sqlite", (err) => {
    if (err) throw err;
});


//STUDENTI//

//funzione creata per avere la lista degli utenti di tipo studente
export const listaStudenti = () => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT id, username, ruolo, nome, cognome
        FROM Utenti
        WHERE ruolo = 'studente';
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                const studenti = rows.map((row) => new Utente(row.id, row.username, row.ruolo, row.nome, row.cognome));
                resolve(studenti);
            }
        });
    });
}

// restituisce uno studente in base all'id
export const getStudenteById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT id, username, ruolo, nome, cognome
        FROM Utenti
        WHERE id = ? AND ruolo = 'studente';
        `;
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row) {
                resolve(new Utente(row.id, row.username, row.ruolo, row.nome, row.cognome));
            } else {
                resolve(null);
            }
        });
    });
}



//** TASK **/



// restituisce la lista dei task per professore
export const listaTaskProfessore = (id_prof) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT Task.*
        FROM Task join Utenti on Task.id_prof = Utenti.id
        WHERE Task.id_prof = ?;
        `;
        db.all(sql, [id_prof], (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length > 0) {
                const tasks = rows.map((row) => new Task(row.id, row.domanda, row.id_prof, row.stato, row.risposta, row.voto, row.dimensione_gruppo));
                resolve(tasks);
            } else {
                resolve([]);
            }
        });
    });
}

// restituisce un task in base allo studente
export const getTaskByStudente = (id_studente) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT Task.*
        FROM Task
        JOIN Gruppi ON Task.id = Gruppi.id_task
        WHERE Gruppi.id_studente = ?;
        `;
        db.all(sql, [id_studente], (err, rows) => {
            if (err) {
                reject(err);
            } else if (rows.length > 0) {
                const tasks = rows.map((row) => new Task(row.id, row.domanda, row.id_prof, row.stato, row.risposta, row.voto, row.dimensione_gruppo));
                resolve(tasks);
            } else {
                resolve([]);
            }
        });
    });
}

// restituisce un task in base all'id
export const getTaskById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT *
        FROM Task
        WHERE id = ?;
        `;
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else if (row==undefined) {
                resolve({error: "Task non disponibile, controlla l'id inserito."});
            } else {
                resolve(new Task(row.id, row.domanda, row.id_prof, row.stato, row.risposta, row.voto, row.dimensione_gruppo));
            }
        });
    });
}

export const addTask=( domanda, id_prof, dimensione_gruppo) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO Task (domanda, id_prof, stato, dimensione_gruppo)
            VALUES (?, ?, 'aperto', ?);
        `;
        db.run(sql, [domanda, id_prof, dimensione_gruppo], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID});
            }
        });
    });
}
//setta il voto e chiude il task
export const setVoteTask = (id_task, voto) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE Task
        SET stato = 'chiuso',
            voto = ?
        WHERE id = ?;
        `;
        db.run(sql, [voto, id_task], function(err) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                resolve({error: "Task non trovato."});
            } else {
                resolve({message: "Inserito voto e Task chiuso con successo."});
            }
        });
    });
}

//rispondere al task
export const rispondiTask = (id_task, risposta) => {
    return new Promise((resolve, reject) => {
        const sql = `
        UPDATE Task
        SET risposta = ?
        WHERE id = ?;
        `;
        db.run(sql, [risposta, id_task], function(err) {
            if (err) {
                reject(err);
            } else if (this.changes === 0) {
                resolve({error: "Task non trovato."});
            } else {
                resolve({message: "Risposta al task aggiornata con successo."});
            }
        });
    });
}



//** Gruppi **/
// restituisce la lista dei gruppi
export const listaGruppi = () => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT *
        FROM Gruppi;
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                
                const gruppi = rows.map((row) => new Gruppo(row.id_task, row.id_studente));
                resolve(gruppi);
            }
        });
    });
}


// restituisce i membri di un gruppo di un task (utile per vedere le coppie)

export const getGruppoListByTask = (id_task) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id_studente
      FROM Gruppi
      WHERE id_task = ?;
    `;
    db.all(sql, [id_task], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const idList = rows.map(row => row.id_studente);
        resolve(idList);
      }
    });
  });
};

//aggiunge il gruppo
export const addGruppo = (id_task, id_utente) => {
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO Gruppi (id_task, id_studente)
        VALUES (?, ?);
        `;
        db.run(sql, [id_task, id_utente], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({id: this.lastID});
            }
        });
    });
}



//** UTILI **/
// controlla se una coppia di  utenti è già presente in un gruppo creato dal professore specifico che superano 2
export const verificaCoppie= (id_prof, id_studente1, id_studente2) => {
    return new Promise((resolve, reject) => {

        const id1 = Math.min(parseInt(id_studente1), parseInt(id_studente2));
        const id2 = Math.max(parseInt(id_studente1), parseInt(id_studente2));
        
        
        const sql = `
            SELECT  
                COUNT(*) AS collaborazioni
            FROM Gruppi s1
            JOIN Gruppi s2 ON s1.id_task = s2.id_task 
            JOIN Task t ON s1.id_task = t.id
            WHERE s1.id_studente < s2.id_studente
            AND t.id_prof = ?
            AND s1.id_studente IN (?) 
            AND s2.id_studente IN (?)
            GROUP BY s1.id_studente, s2.id_studente
            HAVING COUNT(*) >= 2;
        `;
        db.get(sql, [id_prof,id1, id2], (err, row) => {
            if (err) {
                reject(err);
            } else {
                
                const collab= row ? row.collaborazioni : 0;
                const haCollaborato = collab >= 2;
                
                
                resolve(haCollaborato);
            }
        });
    });
}

//** USER **/
//per la verifica della password  e l'username
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Utenti WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: parseInt(row.id), username: row.username, nome: row.nome, ruolo: row.ruolo, cognome: row.cognome};

        const cleanSalt = row.salt.trim();
        

        crypto.scrypt(password, cleanSalt, 32, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.pass, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};


export const checkIfGroupExists = (id_task) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as count FROM Gruppi WHERE id_task = ?';
        db.get(sql, [id_task], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row.count > 0);
            }
        });
    });
};