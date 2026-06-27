
    (() => {
      const storageKey = "observatorio-df-v1";
      const themes = [
        "Demografia", "Economia", "Trabalho", "HabitaÃ§Ã£o", "Mobilidade", "SaÃºde",
        "Diversidade", "SeguranÃ§a", "EducaÃ§Ã£o", "Cultura", "Turismo", "Meio Ambiente",
        "Esporte", "Pets", "Tecnologia", "Consumo de mÃ­dia", "Comportamento", "PolÃ­tica",
        "ConteÃºdo Local", "TendÃªncias"
      ];
      const typeLabels = {
        news: "Novidade",
        indicator: "Indicador",
        insight: "Insight Globo DF"
      };
      const typePills = {
        news: "green",
        indicator: "yellow",
        insight: "blue"
      };
      const trendLabels = {
        none: "Sem variaÃ§Ã£o",
        up: "Crescimento",
        down: "Queda",
        stable: "Estabilidade"
      };

      const $ = (selector) => document.querySelector(selector);
      const form = $("#observer-form");
      const feed = $("#observer-feed");
      const filterType = $("#obs-filter-type");
      const filterTheme = $("#obs-filter-theme");
      const search = $("#obs-search");
      const dateInput = $("#obs-date");
      const today = new Date();
      const isoToday = toISODate(today);

      function toISODate(date) {
        return date.toISOString().slice(0, 10);
      }

      function daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return toISODate(date);
      }

      function escapeHTML(value) {
        return String(value || "").replace(/[&<>"']/g, (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;",
          "'": "&#039;"
        }[char]));
      }

      function defaultItems() {
        return [
          {
            id: crypto.randomUUID(),
            type: "news",
            theme: "Tecnologia",
            trend: "none",
            date: daysAgo(5),
            title: "CIIA-DF consolida inteligÃªncia artificial como agenda pÃºblica",
            source: "CIIA-DF",
            link: "https://ciia.com.br/ciia/",
            note: "A agenda de IA no DF conecta governo, academia, indÃºstria e sociedade civil. Impacto editorial: pautas sobre requalificaÃ§Ã£o, serviÃ§os pÃºblicos, trabalho e inovaÃ§Ã£o."
          },
          {
            id: crypto.randomUUID(),
            type: "indicator",
            theme: "Tecnologia",
            trend: "up",
            date: daysAgo(12),
            title: "DF aparece com alto acesso domiciliar Ã  internet",
            source: "IBGE / PNAD TIC",
            link: "https://sidra.ibge.gov.br/tabela/7307",
            note: "O dado reforÃ§a leitura multiplataforma: TV aberta, streaming, redes sociais e busca por notÃ­cias locais convivem na rotina do brasiliense."
          },
          {
            id: crypto.randomUUID(),
            type: "indicator",
            theme: "Diversidade",
            trend: "up",
            date: daysAgo(18),
            title: "DF acende alerta para processos por LGBTfobia",
            source: "Correio Braziliense / Escavador",
            link: "https://www.correiobraziliense.com.br/cidades-df/2026/06/amp/7449878-df-acende-alerta-para-violencia-contra-populacao-lgbtqia-.html",
            note: "Levantamento citado pela reportagem aponta 64 aÃ§Ãµes entre 2023 e 2026. Impacto editorial: tratar seguranÃ§a, pertencimento, denÃºncia e subnotificaÃ§Ã£o."
          },
          {
            id: crypto.randomUUID(),
            type: "insight",
            theme: "Mobilidade",
            trend: "stable",
            date: daysAgo(3),
            title: "Mobilidade deve ser narrada pela experiÃªncia entre RAs",
            source: "Globo DF / Semob-DF",
            link: "https://www.semob.df.gov.br/",
            note: "O dado de deslocamento ganha forÃ§a quando vira rotina: Ã´nibus, metrÃ´, BRT, aplicativos, carro e tempo perdido. Bom territÃ³rio para jornalismo de serviÃ§o."
          }
        ];
      }

      function loadItems() {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
          if (Array.isArray(saved)) return saved;
        } catch (error) {
          console.warn("NÃ£o foi possÃ­vel ler o ObservatÃ³rio DF.", error);
        }
        const seed = defaultItems();
        saveItems(seed);
        return seed;
      }

      function saveItems(items) {
        localStorage.setItem(storageKey, JSON.stringify(items));
      }

      let items = loadItems();

      function populateThemeFilter() {
        filterTheme.innerHTML = '<option value="all">Todos os temas</option>' +
          themes.map((theme) => `<option value="${escapeHTML(theme)}">${escapeHTML(theme)}</option>`).join("");
      }

      function renderStats(list) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentNews = items.filter((item) => item.type === "news" && new Date(item.date) >= thirtyDaysAgo).length;
        const changedIndicators = items.filter((item) => item.type === "indicator" && item.trend !== "none").length;
        const insights = items.filter((item) => item.type === "insight").length;
        const lastDate = items.map((item) => item.date).sort().at(-1);

        $("#obs-count-news").textContent = recentNews;
        $("#obs-count-indicators").textContent = changedIndicators;
        $("#obs-count-insights").textContent = insights;
        $("#obs-last-update").textContent = lastDate ? lastDate.split("-").reverse().join("/") : "--";
      }

      function getFilteredItems() {
        const type = filterType.value;
        const theme = filterTheme.value;
        const term = search.value.trim().toLowerCase();
        return items
          .filter((item) => type === "all" || item.type === type)
          .filter((item) => theme === "all" || item.theme === theme)
          .filter((item) => {
            if (!term) return true;
            return [item.title, item.source, item.note, item.theme].some((value) =>
              String(value || "").toLowerCase().includes(term)
            );
          })
          .sort((a, b) => b.date.localeCompare(a.date));
      }

      function renderFeed() {
        const visible = getFilteredItems();
        renderStats(visible);
        if (!visible.length) {
          feed.innerHTML = '<div class="feed-empty">Nenhum registro encontrado para os filtros selecionados.</div>';
          return;
        }
        feed.innerHTML = visible.map((item) => {
          const link = item.link
            ? `<a class="feed-link" href="${escapeHTML(item.link)}" target="_blank" rel="noreferrer">abrir fonte</a>`
            : "";
          const trendClass = item.trend === "none" ? "" : ` ${item.trend}`;
          return `
            <article class="feed-item" data-id="${escapeHTML(item.id)}">
              <div class="feed-meta">
                <span>${escapeHTML(item.date.split("-").reverse().join("/"))}</span>
                <span class="pill ${typePills[item.type]}">${escapeHTML(typeLabels[item.type])}</span>
                <span class="pill">${escapeHTML(item.theme)}</span>
                <span class="pill${trendClass}">${escapeHTML(trendLabels[item.trend] || "Sem variaÃ§Ã£o")}</span>
              </div>
              <h4>${escapeHTML(item.title)}</h4>
              <p>${escapeHTML(item.note)}</p>
              <div class="feed-meta">
                <span>${escapeHTML(item.source || "Fonte nÃ£o informada")}</span>
                ${link}
                <button class="observer-button secondary" type="button" data-delete="${escapeHTML(item.id)}">Excluir</button>
              </div>
            </article>
          `;
        }).join("");
      }

      function toCSV(rows) {
        const header = ["tipo", "tema", "variacao", "data", "titulo", "fonte", "link", "resumo"];
        const body = rows.map((item) => [
          typeLabels[item.type],
          item.theme,
          trendLabels[item.trend],
          item.date,
          item.title,
          item.source,
          item.link,
          item.note
        ]);
        return [header, ...body].map((row) =>
          row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
        ).join("\n");
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const item = {
          id: crypto.randomUUID(),
          type: $("#obs-type").value,
          date: $("#obs-date").value,
          theme: $("#obs-theme").value,
          trend: $("#obs-trend").value,
          title: $("#obs-title").value.trim(),
          source: $("#obs-source").value.trim(),
          link: $("#obs-link").value.trim(),
          note: $("#obs-note").value.trim()
        };
        items = [item, ...items];
        saveItems(items);
        form.reset();
        dateInput.value = isoToday;
        renderFeed();
      });

      feed.addEventListener("click", (event) => {
        const id = event.target?.dataset?.delete;
        if (!id) return;
        items = items.filter((item) => item.id !== id);
        saveItems(items);
        renderFeed();
      });

      [filterType, filterTheme, search].forEach((control) => {
        control.addEventListener("input", renderFeed);
      });

      $("#obs-export").addEventListener("click", () => {
        const csv = toCSV(items);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `observatorio-df-${isoToday}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      });

      $("#obs-reset").addEventListener("click", () => {
        items = defaultItems();
        saveItems(items);
        renderFeed();
      });

      dateInput.value = isoToday;
      populateThemeFilter();
      renderFeed();
    })();
  
