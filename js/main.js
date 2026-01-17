const tbody = document.getElementById("data");
const pdfBtn = document.getElementById("pdfBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let articlesGlobal = [];

// Load initial articles on page load
fetch("https://javascriptbackend-5115.onrender.com/api/articles")
    .then(res => res.json())
    .then(data => {
        const articles = data.docs || data;
        articlesGlobal = articles;
        renderTable(articles);
    })
    .catch(error => {
        console.error("Error fetching articles:", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading articles</td></tr>';
    });

// Search functionality
searchBtn.addEventListener("click", () => {
    performSearch();
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        performSearch();
    }
});

function performSearch() {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm === "") {
        // Reload all articles if search is empty
        fetch("https://javascriptbackend-5115.onrender.com/api/articles")
            .then(res => res.json())
            .then(data => {
                const articles = data.docs || data;
                articlesGlobal = articles;
                renderTable(articles);
            })
            .catch(error => {
                console.error("Error fetching articles:", error);
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error loading articles</td></tr>';
            });
    } else {
        // Search via backend API
        fetch(`https://javascriptbackend-5115.onrender.com/api/articles?search=${encodeURIComponent(searchTerm)}`)
            .then(res => res.json())
            .then(data => {
                const articles = data.docs || data;
                articlesGlobal = articles;
                renderTable(articles);
            })
            .catch(error => {
                console.error("Error searching articles:", error);
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error searching articles</td></tr>';
            });
    }
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}

function renderTable(data) {
    tbody.innerHTML = "";
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No articles found</td></tr>';
        return;
    }
    
    data.forEach((article, index) => {

        const title = article.title_display || "No title";
        const date = formatDate(article.publication_date);
        const authors = article.author_display 
            ? article.author_display.join(", ")
            : "N/A";

        const doi = article.id || "";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="number-cell">${index + 1}</td>
            <td>${title}</td>
            <td class="date-cell">${date}</td>
            <td>${authors}</td>
            <td>
                <a href="https://doi.org/${doi}" target="_blank">
                    View DOI
                </a>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* PDF REPORT */
pdfBtn.addEventListener("click", () => {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración del documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;

    // Título del reporte
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("PLOS University Articles Report", margin, y);
    y += 12;

    // Fecha de generación
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const today = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    doc.text(`Generated: ${today}`, margin, y);
    y += 8;

    doc.text(`Total articles: ${articlesGlobal.length}`, margin, y);
    y += 15;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Función para dividir texto largo
    const splitText = (text, maxWidth) => {
        return doc.splitTextToSize(text, maxWidth);
    };

    // Iterar sobre los artículos
    articlesGlobal.forEach((a, index) => {

        // Verificar si necesitamos una nueva página
        if(y > pageHeight - 40){
            doc.addPage();
            y = margin;
        }

        // Número de artículo
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Article ${index + 1}`, margin, y);
        y += 8;

        // Título
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        const titleLines = splitText(`Title: ${a.title_display || "N/A"}`, contentWidth);
        doc.setFont(undefined, 'normal');
        titleLines.forEach(line => {
            if(y > pageHeight - 20){
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 6;
        });
        y += 2;

        // Fecha
        doc.setFontSize(10);
        doc.text(`Date: ${formatDate(a.publication_date)}`, margin, y);
        y += 6;

        // Autores
        const authorsText = `Authors: ${(a.author_display || []).join(", ")}`;
        const authorLines = splitText(authorsText, contentWidth);
        authorLines.forEach(line => {
            if(y > pageHeight - 20){
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 6;
        });
        y += 2;

        // DOI
        doc.text(`DOI: ${a.id}`, margin, y);
        y += 10;

        // Línea separadora entre artículos
        if (index < articlesGlobal.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(margin, y, pageWidth - margin, y);
            y += 10;
        }
    });

    doc.save("plos_report.pdf");
});
