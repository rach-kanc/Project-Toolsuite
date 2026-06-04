let draggedItem = null;
let currentConfigJob = null;
let stageCounter = 0;

// Initialize default pipeline
document.addEventListener('DOMContentLoaded', () => {
    addStage('Build');
    addStage('Test');
    addStage('Deploy');
    setupDragAndDrop();
});

function createStageHTML(title) {
    stageCounter++;
    const stageId = `stage-${stageCounter}`;
    return `
        <div class="stage" id="${stageId}">
            <div class="stage-header">
                <input type="text" value="${title}">
                <span class="stage-delete" onclick="deleteStage('${stageId}')">✖</span>
            </div>
            <div class="stage-body"></div>
        </div>
    `;
}

function addStage(title = 'New Stage') {
    const pipeline = document.getElementById('pipeline');
    pipeline.insertAdjacentHTML('beforeend', createStageHTML(title));
    setupDragAndDrop(); // Re-bind for new dropzones
}

function deleteStage(stageId) {
    if(confirm("Delete this stage and all its jobs?")) {
        document.getElementById(stageId).remove();
    }
}

function createJobCard(title, desc) {
    const id = 'job-' + Math.random().toString(36).substr(2, 9);
    return `
        <div class="job-card" draggable="true" id="${id}" onclick="openConfig('${id}')">
            <span class="delete-btn" onclick="deleteJob(event, '${id}')">✖</span>
            <div class="job-title">${title}</div>
            <div class="job-desc">${desc}</div>
        </div>
    `;
}

function deleteJob(e, id) {
    e.stopPropagation(); // Prevent opening config modal
    document.getElementById(id).remove();
}

// Drag and Drop Logic
function setupDragAndDrop() {
    // Draggable templates from sidebar
    const templates = document.querySelectorAll('.template-card');
    templates.forEach(t => {
        t.addEventListener('dragstart', handleDragStart);
        t.addEventListener('dragend', handleDragEnd);
    });

    // Draggable jobs already in the pipeline
    const jobs = document.querySelectorAll('.job-card');
    jobs.forEach(j => {
        j.addEventListener('dragstart', handleDragStart);
        j.addEventListener('dragend', handleDragEnd);
    });

    // Dropzones (Stage bodies)
    const dropzones = document.querySelectorAll('.stage-body');
    dropzones.forEach(dz => {
        dz.addEventListener('dragover', handleDragOver);
        dz.addEventListener('dragleave', handleDragLeave);
        dz.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('ghost-card'), 0);
    
    if (this.classList.contains('template-card')) {
        e.dataTransfer.setData('text/plain', 'template');
    } else {
        e.dataTransfer.setData('text/plain', 'job');
    }
}

function handleDragEnd() {
    this.classList.remove('ghost-card');
    draggedItem = null;
    document.querySelectorAll('.stage-body').forEach(dz => dz.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (!draggedItem) return;

    const type = e.dataTransfer.getData('text/plain');

    if (type === 'template') {
        const title = draggedItem.dataset.title;
        const desc = draggedItem.dataset.desc;
        this.insertAdjacentHTML('beforeend', createJobCard(title, desc));
        setupDragAndDrop(); // Re-bind new elements
    } else if (type === 'job') {
        this.appendChild(draggedItem);
    }
}

// Configuration Modal Logic
function openConfig(jobId) {
    currentConfigJob = document.getElementById(jobId);
    const title = currentConfigJob.querySelector('.job-title').textContent;
    const desc = currentConfigJob.querySelector('.job-desc').textContent;

    document.getElementById('jobNameInput').value = title;
    document.getElementById('jobDescInput').value = desc;
    document.getElementById('configModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('configModal').style.display = 'none';
    currentConfigJob = null;
}

function saveJobConfig() {
    if (!currentConfigJob) return;
    
    const newTitle = document.getElementById('jobNameInput').value;
    const newDesc = document.getElementById('jobDescInput').value;

    currentConfigJob.querySelector('.job-title').textContent = newTitle || 'Untitled Job';
    currentConfigJob.querySelector('.job-desc').textContent = newDesc || '';

    closeModal();
    if(window.showNotification) window.showNotification('Job updated successfully.', 'success');
}

// Clear Pipeline
function clearPipeline() {
    if(confirm("Are you sure you want to clear the entire pipeline?")) {
        document.getElementById('pipeline').innerHTML = '';
        if(window.showNotification) window.showNotification('Pipeline cleared.');
    }
}

// Export YAML Logic
function exportYAML() {
    const pipeline = document.getElementById('pipeline');
    const stages = pipeline.querySelectorAll('.stage');
    
    if (stages.length === 0) {
        if(window.showNotification) window.showNotification('Pipeline is empty.', 'error');
        return;
    }

    let yaml = "name: Custom CI/CD Pipeline\n\n";
    yaml += "stages:\n";
    
    const stageNames = [];
    stages.forEach(stage => {
        const stageName = stage.querySelector('.stage-header input').value.trim().toLowerCase().replace(/\s+/g, '-');
        stageNames.push(stageName);
        yaml += `  - ${stageName}\n`;
    });

    yaml += "\njobs:\n";
    
    stages.forEach((stage, index) => {
        const stageName = stageNames[index];
        const jobs = stage.querySelectorAll('.job-card');
        
        jobs.forEach(job => {
            const title = job.querySelector('.job-title').textContent.trim();
            const desc = job.querySelector('.job-desc').textContent.trim();
            const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
            
            yaml += `  ${safeTitle}:\n`;
            yaml += `    stage: ${stageName}\n`;
            yaml += `    script:\n`;
            
            // Handle multi-line descriptions as array of scripts
            const scriptLines = desc.split('\\n').filter(l => l.trim() !== '');
            if(scriptLines.length > 0) {
                scriptLines.forEach(line => {
                    yaml += `      - ${line.trim()}\n`;
                });
            } else {
                yaml += `      - echo "Running ${title}"\n`;
            }
            yaml += `\n`;
        });
    });

    // Create download
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if(window.showNotification) window.showNotification('YAML pipeline exported successfully.', 'success');
}
