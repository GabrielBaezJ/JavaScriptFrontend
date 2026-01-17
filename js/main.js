const tbody = document.getElementById("data");
const pdfBtn = document.getElementById("pdfBtn");

let articlesGlobal = [];

fetch("https://javascriptbackend-5115.onrender.com/api/articles")
    .then(res => res.json())
    .then(data => {
        // El backend devuelve un objeto con la propiedad 'docs'
        const articles = data.docs || data;
        articlesGlobal = articles;
        renderTable(articles);
    })
    .catch(error => {
        console.error("Error fetching articles:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error loading articles</td></tr>';
    });

function formatDate(dateStr) {
    if (!dateStr) return "N/A";

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
}

function renderTable(data) {
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

    let y = 10;
    doc.setFontSize(12);

    articlesGlobal.forEach((a, index) => {

        doc.text(`Article ${index+1}`, 10, y);
        y+=7;

        doc.text(`Title: ${a.title_display || "N/A"}`, 10, y);
        y+=7;

        doc.text(`Date: ${formatDate(a.publication_date)}`, 10, y);
        y+=7;

        doc.text(`Authors: ${(a.author_display || []).join(", ")}`, 10, y);
        y+=7;

        doc.text(`DOI: ${a.id}`, 10, y);
        y+=12;

        if(y > 270){
            doc.addPage();
            y=10;
        }
    });

    doc.save("plos_report.pdf");
});
