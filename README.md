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

