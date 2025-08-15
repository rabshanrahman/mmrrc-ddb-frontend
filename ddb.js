// Enter the url of the backend api
const apiUrl = 'http://localhost:3000/api'

const ROOT_TERMS = [
    "GO:0008150",
    "GO:0005575",
    "GO:0003674"
];

async function fetchTerm(id) {
    const res = await fetch(`${apiUrl}/go/${encodeURIComponent(id)}`);
    return res.ok ? await res.json() : null;
}

async function fetchChildren(id) {
    const res = await fetch(`${apiUrl}/go/children/${encodeURIComponent(id)}`);
    return res.ok ? await res.json() : [];
}

async function buildNode(term, container) {
    const li = document.createElement("li");
    li.dataset.id = term.go_id;
    li.dataset.expanded = "false";
    
    const textSpan = document.createElement("span");
    textSpan.classList.add("cursor-pointer", "go-term-text");
    textSpan.textContent = term.name || term.go_id;

    const childrenUL = document.createElement("ul");
    childrenUL.classList.add("ml-4", "space-y-1", "hidden");
    
    li.appendChild(textSpan);
    li.appendChild(childrenUL);

    textSpan.onclick = async (e) => {
    e.stopPropagation();
    showStrains(term);

    const expanded = li.dataset.expanded === "true";
    if (!expanded) {
        if (!li.dataset.loaded) {
        const children = await fetchChildren(term.go_id);
        for (const child of children) {
            const childTerm = await fetchTerm(child.child_go_id);
            if (childTerm) await buildNode(childTerm, childrenUL);
        }
        li.dataset.loaded = "true";
        }
        childrenUL.classList.remove("hidden");
        li.dataset.expanded = "true";
    } else {
        childrenUL.classList.add("hidden");
        li.dataset.expanded = "false";
    }
    };

    container.appendChild(li);
}

async function showStrains(term) {
    const label = document.getElementById("selected-go-label");
    const list = document.getElementById("strain-list");

    label.textContent = `${term.name} (${term.go_id})`;
    list.innerHTML = "<li class='text-gray-500'>Loading strains...</li>";

    try {
    const res = await fetch(`${apiUrl}/go/${encodeURIComponent(term.go_id)}/mmrrc-strains`);
    const strains = res.ok ? await res.json() : [];
    
    list.innerHTML = "";
    
    if (strains.length === 0) {
        list.innerHTML = "<li class='text-gray-500'>No strains linked to this term.</li>";
    } else {
        for (const strain of strains) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = `https://www.mmrrc.org/catalog/sds.php?mmrrc_id=${strain.mmrrc_id}`;
        link.textContent = strain.mmrrc_id;
        link.classList.add("hover:underline");
        li.appendChild(link);
        list.appendChild(li);
        }
    }
    } catch (error) {
    list.innerHTML = "<li class='text-red-500'>Error loading strains.</li>";
    console.error('Error fetching strains:', error);
    }
}

async function init() {
    const tree = document.getElementById("go-tree");
    for (const id of ROOT_TERMS) {
    const term = await fetchTerm(id);
    if (term) buildNode(term, tree);
    }
}

init();