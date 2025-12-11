import { useActionState, useEffect, useState} from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import { useNavigate, useLocation, Link } from "react-router";
import API from "../API/API.mjs";
import "../styles/TaskForm.css"; 

export default function TaskForm(props) {

    const initialState = {
        domanda: "",
    }

    const navigate = useNavigate();
    const location = useLocation();

    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const students = await API.getAllStudents();
                setAllStudents(students);
            } catch (err) {
                return(err);
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, []);
    
    const handleSubmit = async (prevState, formData) => {
        const task=Object.fromEntries(formData);
        task.id_prof = location.state.professore.id;
        
        task.studenti = task.studenti ? 
            task.studenti.split(',').map(id => parseInt(id.trim())) : 
            [];
        task.dimensione_gruppo = task.studenti.length;
        

        
        
        if(task.domanda.trim()===""){
            task.error="La domanda non può essere vuota";
            return task;
        }

        if(task.studenti.length>6 || task.studenti.length<2){
            task.error="Il numero di studenti deve essere compreso tra 2 e 6";
            return task;
        }

        try{
            await API.verificaStudenti(task.studenti, task.id_prof);
        }catch(err){
            task.error = err.message;
            return task;
        }

        try{
            
            await API.addTask(task);
            navigate('/professore');
        }
        catch(err){
            task.error=err.message;
            return task;
        }
    }

    const handleStudentToggle = (student) => {
        if (state.error) {
        
        state.error = '';
        }
        setSelectedStudents(prev => {
            const isSelected = prev.find(s => s.id === student.id);
            if (isSelected) {
                return prev.filter(s => s.id !== student.id);
            } else {
                if (prev.length < 6) {
                    return [...prev, student];
                }
                return prev;
            }
        });
    };

    const renderStudentsTable = () => {
        return (
            <div className="students-table">
                <Row>
                    {allStudents.map(student => {
                        const isSelected = selectedStudents.find(s => s.id === student.id);
                        const canSelect = selectedStudents.length < 6 || isSelected;
                        
                        return (
                            <Col md={6} key={student.id}>
                                <div 
                                    className={`student-card ${
                                        isSelected ? 'selected' : 
                                        canSelect ? 'available' : 'disabled'
                                    }`}
                                    onClick={() => canSelect && handleStudentToggle(student)}
                                >
                                    <i className={`fas ${isSelected ? 'fa-check-square' : 'fa-square'} student-icon`}></i>
                                    <span>{student.nome} {student.cognome}</span>
                                </div>
                            </Col>
                        );
                    })}
                </Row>
            </div>
        );
    };

    const [state, formAction, isPending] = useActionState(handleSubmit, initialState);

    return (
        <div className="task-form-container">
            <h2 className="task-form-title">
                <i className="fas fa-plus-circle"></i>
                Crea Nuova Task
            </h2>
            
            {state.error && <Alert variant="danger" className="alert-enhanced">{state.error}</Alert>}
            

            <Form action={formAction}>
                <div className="enhanced-form-group">
                    <Form.Label className="enhanced-form-label">
                        <i className="fas fa-question-circle"></i>
                        Domanda del Compito
                    </Form.Label>
                    <Form.Control 
                        name="domanda" 
                        type="text" 
                        required={true} 
                        minLength={2}
                        className="enhanced-form-control"
                        placeholder="Inserisci la domanda per il compito..."
                        defaultValue={state.domanda}
                    />
                </div>

                <div className="enhanced-form-group">
                    <Form.Label className="enhanced-form-label">
                        <i className="fas fa-users"></i>
                        Seleziona Studenti (2-6)
                    </Form.Label>
                    
                    <Form.Control 
                        name="studenti" 
                        type="hidden" 
                        value={selectedStudents.map(s => s.id).join(',')} 
                        required={true}
                        minLength={2}
                        readOnly 
                    />

                    <div className="students-selection-container">
                        

                        {loadingStudents ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <div className="loading-text">Caricamento studenti...</div>
                            </div>
                        ) : (renderStudentsTable())}
                               
                        {selectedStudents.length > 0 && (
                            <div className="selected-students-info">
                                <div className="selected-info-header">
                                    <i className="fas fa-check-circle"></i>
                                    Studenti Selezionati:
                                </div>
                                <div className="selected-students-list">
                                    {selectedStudents.map((student, index) => (
                                        <span key={student.id}>
                                            <strong>{student.nome} {student.cognome}</strong>
                                            {index < selectedStudents.length - 1 ? ', ' : ''}
                                        </span>
                                    ))}
                                </div>
                                
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <Button 
                        variant="primary" 
                        type="submit" 
                        disabled={isPending}
                        className="btn-create-task"
                    >
                        {isPending ? (
                            <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Creando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-plus me-2"></i>
                                Crea Task
                            </>
                        )}
                    </Button>
                    
                    <Link className="btn-cancel-task" to={`/professore`}>
                        <i className="fas fa-times me-2"></i>
                        Annulla
                    </Link>
                </div>
            </Form>
        </div>
    );
}
