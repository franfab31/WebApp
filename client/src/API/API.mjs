import {Utente, Task, Gruppo} from '../models/UTGModels.mjs';
const SERVER_URL = 'http://localhost:3001/api';

//ottini tutti gli studenti

const getAllStudents = async () => {
    const response = await fetch(`${SERVER_URL}/students`,{
        credentials: 'include'
    });
    if(response.ok) {
        const info= await response.json();
        return info.map(s => new Utente(s.id, s.username, s.ruolo, s.nome, s.cognome));
    }
    else {
        throw new Error('Errore interno ');
    }
}

//riceve le info su una task con id
const getTaskById = async (id) => {
    const response = await fetch(`${SERVER_URL}/tasks/${id}`, {
        credentials: 'include'
    });
    if(response.ok) {
        const info = await response.json();
        return new Task(info.id, info.domanda, info.id_prof, info.stato, info.risposta, info.voto, info.dimensione_gruppo);
    } else {
        throw new Error('Errore interno');
    }
}




//ottieni uno studente per id
const getStudentById = async (id) => {
    const response = await fetch(`${SERVER_URL}/students/${id}`, {
        credentials: 'include'
    });
    if(response.ok) {
        const info = await response.json();
        return new Utente(info.id, info.username, info.ruolo, info.nome, info.cognome);
    } else {
        throw new Error('Errore interno');
    }
}

//ottieni tutte le task per un professore
const getTasksByProfessorId = async (id) => {
    const response = await fetch(`${SERVER_URL}/tasks/professor/${id}`, {
        credentials: 'include'
    });
    if(response.ok) {
        const info = await response.json();
        return info.map(t => new Task(t.id, t.domanda, t.id_prof, t.stato, t.risposta, t.voto, t.dimensione_gruppo));
    } else {
        throw new Error('Errore interno');
    }
}

  
//ottieni tutte le task per uno studente
const getTasksByStudentId = async (id) => {
    const response = await fetch(`${SERVER_URL}/tasks/student/${id}`, {
        credentials: 'include'
    });
    if(response.ok) {
        const info = await response.json();
        return info.map(t => new Task(t.id, t.domanda, t.id_prof, t.stato, t.risposta, t.voto, t.dimensione_gruppo));
    } else {
        throw new Error('Errore interno');
    }
}

const getStudentiPerTask = async (taskId) => {
  const res = await fetch(`${SERVER_URL}/groups/tasklist/${taskId}`, {
        credentials: 'include'
    });
  if (!res.ok) throw new Error('Errore nel caricamento studenti del task');
  const gruppi= await res.json();
  return gruppi 
};



// aggiunge alla task le informazioni del gruppo di studenti
const getTaskInfo = async (task) => {
    // Carica gli ID degli studenti
    const studentiIds = await getStudentiPerTask(task.id);
    

    // Carica i dettagli degli studenti
    const studenti = [];
    for (const studId of studentiIds) {
        const studente = await getStudentById(studId);
        if (studente) {
            studenti.push({ 
                id: studente.id, 
                nome: studente.nome, 
                cognome: studente.cognome 
            });
        }
    }

    // Aggiungi studenti al task
    task.studenti = studenti;
    return task;
}

// funzione per impostare il voto di un task
const setVotoTask = async (taskId, voto) => {
    const response = await fetch(`${SERVER_URL}/tasks/${taskId}/vote`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ voto })
    });

    if (!response.ok) {
        throw new Error('Errore durante l\'impostazione del voto');
    }
    else {
        return null; 
    }
};

// funzione per avere le informazioni di un prof
const getProfessorStats = async (professoreId) => {
    const tasks = await getTasksByProfessorId(professoreId);
    
    const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.stato === 'chiuso').length,
        toEvaluate: tasks.filter(t => t.risposta && t.voto == null).length,
        notAnswered: tasks.filter(t => !t.risposta).length
    };
    
    return stats;
};

// funzione per avere le informazioni di uno studente(media generale ecc)
const getStudentStats = async (studenteId) => {
    const tasks = await getTasksByStudentId(studenteId);
    
    let sommaPesata = 0;
    let sommaPesi = 0;
    
    // Calcola media ponderata come in getStudentStatsByprof
    for (const task of tasks) {
        if (task.stato === 'chiuso' && task.voto !== null && task.voto !== undefined) {
            const voto = Number(task.voto);
            if (!isNaN(voto) && voto >= 0 && voto <= 30) {
                const peso = 1 / task.dimensione_gruppo;
                sommaPesata += voto * peso;
                sommaPesi += peso;
            }
        }
    }
    
    const mediaGlobale = sommaPesi > 0 ? Math.round((sommaPesata / sommaPesi) * 100) / 100 : 0;
    
    const stats = {
        totalTasks: tasks.length,
        totalAperte: tasks.filter(t => t.stato === 'aperto').length,
        totalChiuse: tasks.filter(t => t.stato === 'chiuso').length,
        totalDaValutare: tasks.filter(t => t.risposta && !t.voto).length,
        mediaGlobale: mediaGlobale
    };
    
    return stats;
};


// utile per avere le info degli studenti di un professore
const getStudentStatsByprof = async (professoreId) => {
  const studenti = await getAllStudents(); 
  const tasks = await getTasksByProfessorId(professoreId); 

  for (const task of tasks) {
    task.studenti = await getStudentiPerTask(task.id);
    

    for (const studtask of task.studenti) {
      const studente = studenti.find(s => s.id === studtask);
      if (!studente) continue;

      if (task.stato === 'aperto') {
        studente.taskaperte++;
      } else if (task.stato === 'chiuso') {
        studente.taskchiuse++;
      }
    }
  }

  for (const s of studenti) {
    let sommaPesata=0;
    let sommaPesi=0;
    for (const task of tasks) {
      if (task.stato === 'chiuso' && task.voto !== null && task.voto !== undefined && task.studenti.includes(s.id)) {
        const voto= Number(task.voto);
        if (isNaN(voto) || voto < 0 || voto > 30) {
          throw new Error('Voto non valido');
        }
        const dimensioneGruppo = task.dimensione_gruppo
        const peso=1 / dimensioneGruppo;
        sommaPesata += voto * peso;
        sommaPesi += peso;
      }
    }
  
    if (sommaPesi > 0) {
        s.media = Math.round((sommaPesata / sommaPesi) * 100) / 100;
    }
}

  return studenti;
};



const verificaStudenti = async (studentiIds, profId) => {
    try {
        
        const studentiInfo = {};
        for (const id of studentiIds) {
            const studente = await getStudentById(id);
            studentiInfo[id] = `${studente.nome} ${studente.cognome}`;
        }
    
        for (let i = 0; i < studentiIds.length; i++) {
            for (let j = i + 1; j < studentiIds.length; j++) {
                const response = await fetch(
                    `${SERVER_URL}/groups/verify?id_prof=${profId}&id_studente1=${studentiIds[i]}&id_studente2=${studentiIds[j]}`, {
                        credentials: 'include'
                    });

                if (!response.ok) {
                    throw new Error('Errore durante la verifica delle coppie');
                }

                const result = await response.json();
                
                
                if (result) { 
                    
                    const nomeStudente1 = studentiInfo[studentiIds[i]];
                    const nomeStudente2 = studentiInfo[studentiIds[j]];
                    throw new Error(`Gli studenti ${nomeStudente1} e ${nomeStudente2} hanno già lavorato insieme piu di due volte.`);
                }
            }
        }

        return { success: true, message: 'Gruppo valido' };
    } catch (error) {
        throw error;
    }
};

const addTask = async (taskData) => {
    
    const response = await fetch(`${SERVER_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            domanda: taskData.domanda,
            id_prof: taskData.id_prof,
            dimensione_gruppo: taskData.dimensione_gruppo,
            studenti: taskData.studenti
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante la creazione del task');
    }

    const newTask = await response.json();
    
    
    await addGruppo(newTask.id, taskData.studenti);
    
    return newTask;
};

const addGruppo = async (taskId, studentiIds) => {
    const response = await fetch(`${SERVER_URL}/groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            id_task: taskId,
            id_studenti: studentiIds
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
    }

    return await response.json();
};

const setRispostaTask = async (taskId, risposta) => {
  try {
    const response = await fetch(`${SERVER_URL}/tasks/${taskId}/risposta`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ risposta })
    });

    if (!response.ok) {
      let errorMsg = 'Errore durante l\'invio della risposta';
      try {
        const error = await response.json();
        errorMsg = error.error || error.message || errorMsg;
      } catch (_) {
       
      }
      throw new Error(errorMsg);
    }

    return await response.json();

  } catch (error) {
    throw error; 
  }
};



const login = async (credentials) => {
    const response = await fetch(`${SERVER_URL}/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', 
        body: JSON.stringify(credentials)
    });

    if (response.ok) {
        const user = await response.json();
        return user;
    }
    else{
        const error = await response.text();
        throw error;
    }
}


const getUserInfo = async () => {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    credentials: 'include',
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user;  // an object with the error coming from the server
  }
};

const logOut = async () => {
  
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (response.ok) {
    return null;
  } else {
    const error = await response.json();
    throw error;
  }
};

const API = {
    getAllStudents, getStudentById,
    getTasksByProfessorId, getTasksByStudentId, getStudentStatsByprof, 
    getStudentiPerTask, getTaskInfo, setVotoTask, 
    verificaStudenti, addTask, addGruppo,getProfessorStats,getStudentStats,setRispostaTask,login
    , getUserInfo, logOut,getTaskById
}
export default API;