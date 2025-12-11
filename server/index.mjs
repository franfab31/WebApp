// imports
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import {check, validationResult} from 'express-validator';
import {listaStudenti, getStudenteById,listaTaskProfessore,getTaskByStudente,getTaskById,
  addTask,setVoteTask, rispondiTask, addGruppo,verificaCoppie, getGruppoListByTask, getUser, checkIfGroupExists
} from  './dao.mjs'

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

// init express
const app = new express();
const port = 3001;

// middleware
app.use(express.json());
app.use(morgan('dev'));



const corsOptions = {
    origin: 'http://localhost:5173', 
    optionsSuccessState: 200,
    credentials: true, // Permette l'invio del cookie
};

app.use(cors(corsOptions));

                ///////////////
                ////SESSION////
                ///////////////

passport.use(new LocalStrategy(async function verify(username, password, cb) {
        const user = await getUser(username, password);
        if(!user) {
            
            return cb(null, false, 'Invalid username or password' );
        }
        return cb(null, user);
    }
));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

// Middleware se autenticato
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

// middleware se prof
const isProfessore = (req, res, next) => {
  if(req.isAuthenticated() && req.user.ruolo === 'insegnante') {
    return next();
  }
  return res.status(403).json({error: 'Accesso negato devi essere un professore.'});
}

// middleware se studente
const isStudente = (req, res, next) => {
  if(req.isAuthenticated() && req.user.ruolo === 'studente') {
    return next();
  }
  return res.status(403).json({error: 'Accesso negato devi essere uno studente.'});
}

//middleware prof accede solo ai suoi dati 
const checkProfessorOwnership = async (req, res, next) => {
  try {
    const professorId = parseInt(req.params.id);
    if (req.user.id !== professorId) {
      return res.status(403).json({error: 'Accesso negato. Puoi accedere solo ai tuoi dati.'});
    }
    next();
  } catch (err) {
    res.status(500).json({error: 'Server error'});
  }
};

// middleware studente accede solo ai suoi dati
const checkStudentOwnership = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    if (req.user.id !== studentId) {
      return res.status(403).json({error: 'Accesso negato. Puoi accedere solo ai tuoi dati.'});
    }
    next();
  } catch (err) {
    res.status(500).json({error: 'Server error'});
  }
};

// Middleware per controllare se il task appartiene al professore o allo studente
const checkTaskOwnership = async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = await getTaskById(taskId);
    
    if (task.error) {
      return res.status(404).json({error: 'Task not found'});
    }

    // Se è professore, deve essere il proprietario del task
    if (req.user.ruolo === 'insegnante' && req.user.id !== task.id_prof) {
      return res.status(403).json({error: 'Accesso negato. Puoi accedere solo ai tuoi task.'});
    }

    // Se è studente, deve far parte del gruppo del task
    if (req.user.ruolo === 'studente') {
      const gruppi = await getGruppoListByTask(taskId);
      if (!gruppi.includes(req.user.id)) {
        return res.status(403).json({error: 'Accesso negato. Non fai parte di questo gruppo.'});
      }
    }

    req.task = task; 
    next();
  } catch (err) {
    res.status(500).json({error: 'Server error'});
  }
};


app.use(session({
  secret: "session",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

                ///////////
                ////GET////
                ///////////

// Get the task by id
app.get('/api/tasks/:id', isLoggedIn, checkTaskOwnership, async (req, res) => {
    try {
        // Usa il task già recuperato dal middleware checkTaskOwnership
        const task = req.task;
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: "Errore interno del server" });
    }
});

// Get all students (solo professori)
app.get('/api/students', isLoggedIn, isProfessore, async (req, res) => {
    listaStudenti()
        .then(students => res.json(students))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Get a student by ID (chiunque sia autenticato)
app.get('/api/students/:id', isLoggedIn, async (req, res) => {
    try {
        const studente = await getStudenteById(req.params.id);
        if (!studente) {
            // Studente non trovato: restituisci 404
            return res.status(404).json({ error: "Studente non trovato" });
        }
        res.json(studente);
    } catch (err) {
        res.status(500).json({ error: "Errore interno del server" });
    }
});


// Get all tasks for a professor (devono essere i suoi task)
app.get('/api/tasks/professor/:id', isLoggedIn, isProfessore, checkProfessorOwnership, async (req, res) => {
  try {
    const tasks = await listaTaskProfessore(req.params.id);
    res.json(tasks); // restituisce sempre un array (anche vuoto)
  } catch (err) {
    res.status(500).end()
  }
});

// Get all tasks for a student (studente stesso)
app.get('/api/tasks/student/:id', isLoggedIn,isStudente, checkStudentOwnership,async (req, res) => {
  try {
    const tasks = await getTaskByStudente(req.params.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).end()
  }
});


//Get a grouplist by task (chi appertiene al task)
app.get('/api/groups/tasklist/:id', isLoggedIn, checkTaskOwnership, async (req, res) => {
    const id_task = req.params.id;
    try {
        const gruppi = await getGruppoListByTask(id_task);
        if(gruppi.error) {
            return res.status(404).json({ error: gruppi.error });
        }else {
            res.json(gruppi);
        }
    } catch (err) {
        res.status(500).end()
    }
});

// Verify pairs of students in a group (solo professori)
app.get('/api/groups/verify', isLoggedIn,isProfessore, async (req, res) => {

    const { id_prof, id_studente1, id_studente2 } = req.query;


    if(parseInt(id_prof) !== req.user.id) {
        return res.status(403).json({ error: 'Accesso negato. Un professore puo verificare le coppie solo per lui.' });
    }

    // Controlla che tutti i parametri siano presenti
    if (
        !id_prof || !id_studente1 || !id_studente2 ||
        isNaN(parseInt(id_prof)) ||
        isNaN(parseInt(id_studente1)) ||
        isNaN(parseInt(id_studente2))
    ) {
        return res.status(400).json({ error: 'Parametri id_prof, id_studente1 e id_studente2 devono essere numeri interi e obbligatori' });
    }

    try {
        // Verifica se la coppia ha collaborato almeno due volte
        const coppie = await verificaCoppie(id_prof, id_studente1, id_studente2);

        res.status(200).json(coppie);
    } catch (err) {
        // Gestione degli errori
        res.status(500).end()
    }
});

                //////////
                ///POST///
                //////////
// Add a new task (solo professori)
app.post('/api/tasks', isLoggedIn, isProfessore, [
    check('domanda').notEmpty(),
    check('id_prof').notEmpty(),
    check('dimensione_gruppo').isNumeric(),
    check('studenti').isArray({ min: 2, max: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { domanda, id_prof, dimensione_gruppo, studenti } = req.body;

    if (req.user.id !== parseInt(id_prof)) {
        return res.status(403).json({ error: 'Accesso negato. Puoi aggiungere solo task per te stesso.' });
    }

    try {
        // Controllo collaborazioni tra tutte le coppie
        for (let i = 0; i < studenti.length; i++) {
            for (let j = i + 1; j < studenti.length; j++) {
                const haCollaborato = await verificaCoppie(id_prof, studenti[i], studenti[j]);
                if (haCollaborato) {
                    return res.status(400).json({ 
                        error: `Gli studenti con id ${studenti[i]} e ${studenti[j]} hanno già collaborato almeno 2 volte. Non possono essere nello stesso gruppo.` 
                    });
                }
            }
        }
        
        const task = await addTask(domanda, id_prof, dimensione_gruppo);
        
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: "Errore interno del server" });
    }
});


  // Add a new group (solo professori)
app.post('/api/groups', isLoggedIn,isProfessore, [check('id_task').notEmpty(), check('id_studenti').isArray()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id_task, id_studenti } = req.body;

    try {
        const task = await getTaskById(id_task);
        if(task.error) {
            return res.status(404).json({ error: task.error });
        }
        //solo per se stesso
        if(task.id_prof !== req.user.id) {
            return res.status(403).json({ error: 'Accesso negato. Puoi aggiungere gruppi solo per i tuoi task.' });
        } 

        const esisteGruppo = await checkIfGroupExists(id_task);
        if (esisteGruppo) {
            return res.status(400).json({ error: 'Esiste già un gruppo per questo task' });
        }
        const prof_id = task.id_prof;
        // Verifica se gli studenti fanno già parte di un gruppo in comune
        for (let i = 0; i < id_studenti.length; i++) {
            for (let j = i + 1; j < id_studenti.length; j++) {
                const haCollaborato = await verificaCoppie(prof_id, id_studenti[i], id_studenti[j]);
                if (haCollaborato) {
                    return res.status(400).json({ error: `Gli studenti ${id_studenti[i]} e ${id_studenti[j]} fanno già parte di un gruppo in comune.` });
                }
            }
        }

        // Aggiungi ogni studente al gruppo
        const risultati = [];
        for (const id_utente of id_studenti) {
            const gruppo = await addGruppo(id_task, id_utente);
            risultati.push(gruppo);
        }

        res.status(201).json(risultati);
    } catch (err) {
       res.status(500).end()
    }
});


                //////////
                ///PUT///
                //////////

// Set vote for a task(solo professore e solo se e il suo task)
app.put('/api/tasks/:id/vote',isLoggedIn, isProfessore, [check('voto').isNumeric()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const idtask = req.params.id;
    const voto = req.body.voto;

    try {

        const task = await getTaskById(idtask);
        if(!task || task.error) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Controlla se il professore è il proprietario del task
        if(task.id_prof !== req.user.id) {
            return res.status(403).json({ error: 'Accesso negato. Puoi dare voti solo ai tuoi task.' });
        }

        else if(task.stato == 'chiuso') {
            return res.status(400).json({ error: 'Task chiuso non si puo modificare il voto' });
        }
        else if(voto < 0 || voto >30) {
            return res.status(400).json({ error: 'deve essere tra 0 e 30' });
        }

        else if(!task.risposta) {
            return res.status(400).json({ error: 'Si deve prima rispondere alla domanda' });
        }

        const risultato=await setVoteTask(idtask, voto);
        if(risultato.error) {
            return res.status(404).json({ error: risultato.error });
        }else {
            res.json(risultato);
        }
    } catch (err) {
       res.status(500).end()
    }
});

// rispondere a task (solo studente e solo se e il suo task)
app.put('/api/tasks/:id/risposta', isLoggedIn,isStudente, [check('risposta').notEmpty()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const idtask = req.params.id;
    const risposta = req.body.risposta;

    try {
        const task = await getTaskById(idtask);
        if(task.error) {
            return res.status(404).json({ error: task.error });
        }
        if(task.stato == 'chiuso') {
            return res.status(400).json({ error: 'Task chiuso non si puo rispondere' });
        }
        // Controlla se lo studente fa parte del gruppo del task
        const gruppo= await getGruppoListByTask(idtask);
        if(!gruppo.includes(req.user.id)) {
            return res.status(403).json({ error: 'Accesso negato. Non fai parte di questo gruppo.' });
        }
        const risultato=await rispondiTask(idtask, risposta);
        if(risultato.error) {
            return res.status(404).json({ error: task.error });
        }else {
            res.json(risultato);
        }
    } catch (err) {
        res.status(500).end()
    }
});


// POST /api/sessions
app.post('/api/sessions', passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

app.listen(port, () => { console.log(`API server started at http://localhost:${port}`); });