# ARTIFICE
ARTIC Real Time Integrated Field Informatics Control Engine

#### This is work in progress and doesn't actually do much at the moment

### Installing

```$bash
git clone https://github.com/rambaut/artifice.git
cd artifice
npm install
```

### Running

First start the demon process:

```$bash
node artificed.js
```

In a separate shell, use the command line program to control the demon:

```$bash
./artifice.js --help
./artifice.js status
```

### Command line interface

Create a project:

```$bash
./artifice.js new-project my_project \
    --title "This is my new sequencing project" \
    --protocol "ARTIC_EBOV_v1.0" \
    --start-date 2019-07-10 \
    --description "A description of the project"
```

Creating a project automatically enters it (i.e., makes it the current project). This can also be done retrospectively:

```$bash
./artifice.js enter-project my_project
```

Start a new run:

```$bash
./artifice.js new-run todays_run \
    --title "MinION run on Thursday" \
    --start-date 2019-07-10 \
    --description "A description of the run"
```

Add samples descriptions with barcode allocations:

```$bash
./artifice.js add-sample patient_001 \
    --barcodes NB01,NB02 \
    --collection-date 2019-05-04 
./artifice.js add-sample patient_002 \
    --barcodes NB03 \
    --collection-date 2019-05-05 
./artifice.js add-sample patient_003 \
    --barcodes NB04 \
    --collection-date 2019-05-06
    .
    .
    . 
```

### Command line help

```
Usage: artifice [options] [command]
   
ARTIFICE command line interface

Options:
  -V, --version                      output the version number
  -h, --help                         output usage information

Commands:
  new-project|np [options] <name>    Create a new project
  list-projects|lp [options]         List current projects
  get-projects|gp                    Get current projects in JSON format
  enter-project|ep <name>            Enter a project (make it current)
  exit-project|xp                    Exit currently selected project
  close-project|cp [options] <name>  Close a project (cannot be further modified, unless reopened)
  reopen-project|rp <name>           Re-open a closed project
  new-run|nr [options] <name>        Create a new run within the current project
  list-runs|lr [options]             List runs within the current project
  enter-run|er <name>                Enter a run (make it current)
  exit-run|xr                        Exit the current run
  end-run|er [options] <name>        End a run (cannot be further modified, unless restarted)
  restart-run|rr <name>              Re-start an ended run
  add-sample|ns [options] <name>     Add a new sample within the current run
  list-samples|ls [options]          List samples within the current project
  status|st [options]                Provide information about the current status of ARTIFICE
  get-documents|gd                   Get all documents within the datastore in JSON format
```