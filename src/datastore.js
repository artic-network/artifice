/**
 * Provides access to the datastore. All the functions return promises
 */
const logger = require('./logger')
const PouchDB = require('pouchdb-node');
PouchDB.plugin(require('pouchdb-find'));

const db = new PouchDB('artifice_db');

const CURRENT_PROJECT_ID = 'current_project';
const CURRENT_RUN_ID = 'current_run';

/**
 * Add a new project to the database
 * @param name
 * @param title
 * @param protocol
 * @param startDate
 * @param description
 */
async function newProject(name, title = null, protocol = null, startDate = new Date(), description = "") {

    // First check to see if a document with that name exists
    const results = await db.find({ selector: {_id: name, type: 'project'} });

    // if it does, throw an error
    if (results.docs.length > 0) {
        throw new Error('Error creating project: The project with name, ' + name + ', already exists.');
    }

    // create the new project object
    const theNewProject = {
        _id: name,
        type: "project",
        title: (title ? title : `Project[${name}]`),
        protocol: (protocol ? protocol : 'unspecified'),
        startDate: (typeof startDate === Date ? startDate.toISOString() : new Date().toISOString()),
        description: (description ? description : "")
    };

    // put it in the database
    return db.put(theNewProject);
}

/**
 * Get the project document with the given id
 * @param projectId
 * @returns {Promise<*>}
 */
async function getProject(projectId) {
    // try to find the project
    const results = await db.find({
        selector: {_id: projectId, type: 'project'},
    });

    // if no results are return then throw an error
    if (results.docs.length === 0) {
        throw new Error("Project with id, " + projectId + ", doesn't exist.")
    }

    // otherwise return the document
    return results.docs[0];
}

/**
 * Sets the current working project to the given id
 * @param projectId
 * @returns {Promise<*>}
 */
async function setCurrentProject(projectId) {
    try {
        // check the project exists
        const project = await getProject(projectId);

        // see if a current project document already exists
        let currentProject = getCurrentProject();

        // if it does not yet exist, then create it
        if (currentProject == null) {
            currentProject = {
                _id: CURRENT_PROJECT_ID,
            };
        }

        // add or update the project id
        currentProject.project_id = project._id;

        // put the document in the database
        db.put(currentProject);

        // return the actual project
        return project;
    } catch (err) {
        logger.error(err);
        throw new Error("Project with id, " + projectId + ", doesn't exist.")
    }
}

/**
 * Remove the current project document from the database
 * @returns {Promise<*>}
 */
async function clearCurrentProject() {
    // see if a current project document already exists
    let currentProject = getCurrentProject();

    // if it does exist, then remove it
    if (currentProject != null) {
        db.remove(currentProject);
    }

    // return the removed document
    return currentProject;
}

/**
 * Sets the given project as closed
 * @returns {Promise<*>}
 */
async function closeProject(projectId, endDate = new Date()) {
    const project = await getProject(projectId);
    if (project != null) {
        project.closed = true;
        project.endDate = endDate;

        db.put(project);
    } else {
        throw new Error("Project with id, " + projectId + ", doesn't exist.")
    }
}

/**
 * Sets the given project as closed
 * @returns {Promise<*>}
 */
async function reopenProject(projectId) {
    const project = await getProject(projectId);
    if (project != null) {
        project.closed = false;
        project.endDate = undefined;

        db.put(project);
    } else {
        throw new Error("Project with id, " + projectId + ", doesn't exist.")
    }
}

/**
 * Returns the project specified as the current project.
 * @returns {Promise<*>}
 */
async function getCurrentProject() {
    try {
        // get the current project doc
        const currentProjectDoc = await db.get(CURRENT_PROJECT_ID);

        // return the project given by the project_id
        return getProject(currentProjectDoc.project_id);
    } catch (err) {
        return null
    }
}

/**
 * Returns a list of all project documents
 * @returns {*}
 */
async function getProjects() {
    const results = await db.find({
        selector: {type: 'project'},
        sort: ['_id']
    });
    return results.docs;
}

/**
 * Remove the passed project from the database.
 *
 * As a minimum this needs to be {_id: the_id, _rev: the_rev}
 * @param project
 */
function deleteProject(project) {
    // TODO probably need some protection here...
    db.remove(project);
}

/**
 * Create a new run document as part of the current project.
 * @param name
 * @param title
 * @param description
 * @param startDate
 * @returns {Promise<*>}
 */
async function newRun(name, title = null, startDate = new Date(), description = "") {

    // a project must exist before we can create a run
    const currentProject = await getCurrentProject();
    if (currentProject == null) {
        throw new Error("No project currently set.")
    }

    // First check to see if a document with that name exists
    const results = await db.find({ selector: { _id: name, type: 'run', project_id: currentProject._id } });

    // if it does, throw an error
    if (results.docs.length > 0) {
        throw new Error('Error creating run: A run in this project with name, ' + name + ', already exists.');
    }

    // create the new run object
    const theNewRun = {
        _id: name,
        type: "run",
        project_id: currentProject._id,
        title: (title ? title : `Run[${name}]`),
        description: (description ? description : ""),
        startDate: (typeof startDate === Date ? startDate.toISOString() : new Date().toISOString())
    };

    // put it in the database
    return db.put(theNewRun);
}

/**
 * Get a run document with the given id
 * @param runId
 * @returns {Promise<*>}
 */
async function getRun(runId) {
    // try to find the run
    const results = await db.find({
        selector: {_id: runId, type: 'run'},
    });

    // if no results are return then throw an error
    if (results.docs.length === 0) {
        throw new Error("Run with id, " + runId + ", doesn't exist.")
    }

    // otherwise return the document
    return results.docs[0];
}

/**
 * Set the current run within the current project
 * @param runId
 * @returns {Promise<*>}
 */
async function setCurrentRun(runId) {
    try {
        // check the run exists
        const run = await getRun(runId);

        // see if a current run document already exists
        let currentRun = getCurrentRun();

        // if it does not yet exist, then create it
        if (currentRun == null) {
            currentRun = {
                _id: CURRENT_RUN_ID,
            };
        }

        // add or update the project id
        currentRun.run_id = run._id;

        // put the document in the database or update it
        db.put(currentRun);

        // return the actual run
        return run;
    } catch (err) {
        logger.error(err);
        throw new Error("Run with id, " + runId + ", doesn't exist.")
    }
}

/**
 * Return currently selected run document
 * @returns {Promise<*>}
 */
async function getCurrentRun() {
    try {
// get the current run doc
        const currentRunDoc = await db.get(CURRENT_RUN_ID);

        // return the run given by the run_id
        return getRun(currentRunDoc.run_id);
    } catch (err) {
        return null
    }
}

/**
 * Remove the current run document
 * @returns {Promise<*>}
 */
async function clearCurrentRun() {
    // see if a current run document already exists
    let currentRun = getCurrentRun();

    // if it does exist, then remove it
    if (currentRun != null) {
        db.remove(currentRun);
    }

    return currentRun;
}

/**
 * Sets the given run as ended
 * @returns {Promise<*>}
 */
async function endRun(runId, endDate = new Date()) {
    const run = await getRun(runId);
    if (run != null) {
        run.ended = true;
        run.endDate = endDate;

        db.put(run);
    } else {
        throw new Error("Run with id, " + runId + ", doesn't exist.")
    }
}

/**
 * Sets the given project as closed
 * @returns {Promise<*>}
 */
async function restartRun(runId) {
    const run = await getRun(runId);
    if (run != null) {
        run.ended = false;
        run.endDate = undefined;

        db.put(run);
    } else {
        throw new Error("Run with id, " + runId + ", doesn't exist.")
    }
}

/**
 * Get a list of all the runs for the given project
 * @returns {*}
 */
async function getRuns(project = currentProject) {
    const results = await db.find({
        selector: {type: 'run', project_id: project._id},
        sort: ['_id']
    });
    return results.docs;
}

/**
 * Remove the passed run from the database.
 *
 * As a minimum this needs to be {_id: the_id, _rev: the_rev}
 * @param run
 */
function deleteRun(run) {
    db.remove(run);
}

/**
 * Create a new sample within the current run and project
 * @param name
 * @param description
 * @param barcodes
 * @param collectionDate
 * @returns {*}
 */
async function newSample(name, collectionDate, barcodes, description = "") {
    // if no project is currently selected then we can't create a new sample
    const currentProject = getCurrentProject();
    if (currentProject == null) {
        throw new Error("No project currently set.")
    }

    // if no run is currently selected then we can't create a new sample
    const currentRun = getCurrentRun();
    if (currentRun == null) {
        throw new Error("No run currently set.")
    }

    // First check to see if a document with that name exists
    const results = await db.find({ selector: { _id: name, type: 'sample' }});

    // if it does, throw an error
    if (results.docs.length > 0) {
        throw new Error('Error creating sample: A sample in this project with name, ' + name + ', already exists.');
    }


    // create the sample document
    const sample = {
        _id: name,
        type: "sample",
        project: currentProject._id,
        run: currentRun._id,
        barcodes: barcodes,
        collectionDate: (typeof collectionDate === Date ? collectionDate.toISOString() : collectionDate),
        description: (description ? description : "")
    };

    // put it in the database
    return db.put(sample);
}

/**
 * Get a sample with the given id
 * @param sampleId
 * @returns {*}
 */
function getSample(sampleId) {
    return db.find({
        selector: {_id: sampleId, type: 'sample'},
    });
}

/**
 * Get a list of samples for the given run
 * @returns {*}
 */
async function getSamples(project, run = null) {
    const selector = {type: 'sample', project_id: project._id };
    if (run != null) {
        selector.run_id = run._id;
    }
    const results = await db.find({
        selector: selector,
        sort: ['_id']
    });
    return results.docs;
}

/**
 * Remove the passed sample from the database.
 *
 * As a minimum this needs to be {_id: the_id, _rev: the_rev}
 * @param sample
 */
function deleteSample(sample) {
    db.remove(sample);
}

async function updateDocument(document) {
    db.put(document);
}
/**
 * Get a list of all the documents currently in the database
 * @returns {*}
 */
async function getAllDocuments() {
    const results = await db.allDocs({include_docs: true});
    return results.rows.map((row) => row.doc );
}

// Export all methods
module.exports = {
    newProject, getProject, setCurrentProject, getCurrentProject, clearCurrentProject, closeProject, reopenProject, getProjects, deleteProject,
    newRun, getRun, setCurrentRun, getCurrentRun, clearCurrentRun, getRuns, endRun, restartRun, deleteRun,
    newSample, getSample, getSamples, deleteSample,
    updateDocument, getAllDocuments
};
