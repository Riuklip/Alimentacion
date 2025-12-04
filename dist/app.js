// Variables globales para los datos
let workers = [];
let foodsCatalog = [];
let currentWorkerId = null;
let nextWorkerId = 1;
let nextFoodId = 1;

// Precios por tipo de alimentación (en pesos)
const dietPrices = {
    normal: 400,
    mejorada: 500
};

// Categorías de alimentos
const foodCategories = {
    frutas: { name: "🍎 Frutas", color: "#ff6b6b" },
    verduras: { name: "🥦 Verduras", color: "#51cf66" },
    carnes: { name: "🍗 Carnes", color: "#ff922b" },
    pescados: { name: "🐟 Pescados", color: "#339af0" },
    lacteos: { name: "🥛 Lácteos", color: "#ffd43b" },
    cereales: { name: "🌾 Cereales", color: "#cc5de8" },
    bebidas: { name: "🥤 Bebidas", color: "#20c997" },
    otros: { name: "📦 Otros", color: "#adb5bd" }
};

// ==================== INICIALIZACIÓN ====================

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromLocalStorage();
    setupEventListeners();
    updateFoodUsageStats();
});

// Cargar datos desde localStorage
function loadDataFromLocalStorage() {
    const savedData = localStorage.getItem('foodManagementData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            workers = data.workers || [];
            foodsCatalog = data.foodsCatalog || [];
            nextWorkerId = data.nextWorkerId || 1;
            nextFoodId = data.nextFoodId || 1;
            
            renderWorkers();
            renderFoodsCatalog();
            updateSummary();
            updateFoodUsageStats();
            
            showStatus('✅ Datos cargados desde el almacenamiento local', 'success');
        } catch (error) {
            console.error('Error cargando datos:', error);
            initializeWithSampleData();
        }
    } else {
        initializeWithSampleData();
    }
}

// Guardar datos en localStorage
function saveDataToLocalStorage() {
    const data = {
        workers: workers,
        foodsCatalog: foodsCatalog,
        nextWorkerId: nextWorkerId,
        nextFoodId: nextFoodId
    };
    localStorage.setItem('foodManagementData', JSON.stringify(data));
}

// Inicializar con datos de ejemplo
function initializeWithSampleData() {
    workers = [
        { 
            id: 1, 
            name: "Juan", 
            surname: "García Pérez", 
            diet: "normal", 
            days: 20, 
            snacks: 10, 
            snackPrice: 50, 
            foods: [
                { id: 1, name: "Manzana", quantity: 5, price: 20, store: "kaniki" },
                { id: 3, name: "Pollo", quantity: 2, price: 150, store: "punta_brava" }
            ]
        },
        { 
            id: 2, 
            name: "María", 
            surname: "López Rodríguez", 
            diet: "mejorada", 
            days: 18, 
            snacks: 8, 
            snackPrice: 50, 
            foods: [
                { id: 2, name: "Plátano", quantity: 8, price: 15, store: "kaniki" },
                { id: 5, name: "Lechuga", quantity: 3, price: 30, store: "punta_brava" }
            ]
        },
        { 
            id: 3, 
            name: "Carlos", 
            surname: "Martínez Sánchez", 
            diet: "normal", 
            days: 22, 
            snacks: 15, 
            snackPrice: 50, 
            foods: [
                { id: 4, name: "Salmón", quantity: 2, price: 200, store: "kaniki" },
                { id: 1, name: "Manzana", quantity: 10, price: 20, store: "punta_brava" }
            ]
        }
    ];
    
    foodsCatalog = [
        { id: 1, name: "Manzana", category: "frutas" },
        { id: 2, name: "Plátano", category: "frutas" },
        { id: 3, name: "Pollo", category: "carnes" },
        { id: 4, name: "Salmón", category: "pescados" },
        { id: 5, name: "Lechuga", category: "verduras" },
        { id: 6, name: "Yogur", category: "lacteos" },
        { id: 7, name: "Arroz", category: "cereales" },
        { id: 8, name: "Agua", category: "bebidas" }
    ];
    
    nextWorkerId = 4;
    nextFoodId = 9;
    
    renderWorkers();
    renderFoodsCatalog();
    updateSummary();
    updateFoodUsageStats();
    saveDataToLocalStorage();
    
    showStatus('✅ Sistema iniciado con datos de ejemplo', 'success');
}

// ==================== EVENT LISTENERS ====================

// Configurar event listeners
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(this.dataset.tab + '-tab').classList.add('active');
        });
    });
    
    // Botón añadir trabajador
    document.getElementById('add-worker-btn').addEventListener('click', function() {
        openWorkerModal();
    });
    
    // Botón añadir alimento al catálogo
    document.getElementById('add-food-catalog-btn').addEventListener('click', function() {
        openFoodCatalogModal();
    });
    
    // Formulario trabajador
    document.getElementById('worker-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveWorker();
    });
    
    // Formulario alimento catálogo
    document.getElementById('food-catalog-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveFoodCatalog();
    });
    
    // Botón añadir alimento a trabajador
    document.getElementById('add-food-btn').addEventListener('click', function() {
        addFoodToWorker();
    });
    
    // Botón exportar trabajador a Excel
    document.getElementById('export-worker-excel-btn')?.addEventListener('click', function() {
        if (currentWorkerId) {
            exportWorkerToExcel(currentWorkerId);
        }
    });
    
    // Botones de importación/exportación Excel
    document.getElementById('import-workers-excel-btn').addEventListener('click', function() {
        document.getElementById('import-file').setAttribute('data-type', 'workers-excel');
        document.getElementById('import-file').click();
    });
    
    document.getElementById('import-foods-excel-btn').addEventListener('click', function() {
        document.getElementById('import-file').setAttribute('data-type', 'foods-excel');
        document.getElementById('import-file').click();
    });
    
    document.getElementById('export-excel-btn').addEventListener('click', function() {
        exportAllToExcel();
    });
    
    document.getElementById('export-summary-excel-btn').addEventListener('click', function() {
        exportSummaryToExcel();
    });
    
    document.getElementById('export-full-excel-btn').addEventListener('click', function() {
        exportFullReportToExcel();
    });
    
    document.getElementById('export-detailed-excel-btn').addEventListener('click', function() {
        exportDetailedReportToExcel();
    });
    
    // Botones de plantillas
    document.getElementById('download-template-btn').addEventListener('click', function() {
        downloadExcelTemplates();
    });
    
    document.getElementById('download-workers-template-btn').addEventListener('click', function() {
        downloadWorkersTemplate();
    });
    
    document.getElementById('download-foods-template-btn').addEventListener('click', function() {
        downloadFoodsTemplate();
    });
    
    // Botón para exportar resumen específico de alimentos
    document.getElementById('export-food-summary-btn').addEventListener('click', function() {
        exportFoodSummaryToExcel();
    });
    
    // Botones de importación Excel desde la pestaña Excel
    document.querySelectorAll('.import-excel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            document.getElementById('import-file').setAttribute('data-type', type + '-excel');
            document.getElementById('import-file').click();
        });
    });
    
    // Botones JSON
    document.getElementById('import-json-btn').addEventListener('click', function() {
        document.getElementById('import-file').setAttribute('data-type', 'json');
        document.getElementById('import-file').click();
    });
    
    document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
    document.getElementById('reset-data-btn').addEventListener('click', resetData);
    
    document.getElementById('import-file').addEventListener('change', function(e) {
        importData(e);
    });
    
    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// ==================== FUNCIONES DE EXCEL ====================

// Descargar plantillas de Excel
function downloadExcelTemplates() {
    try {
        // Plantilla de trabajadores
        const workersTemplate = [
            ['Nombre', 'Apellidos', 'TipoDieta', 'DiasTrabajados', 'Meriendas', 'PrecioMerienda'],
            ['Juan', 'García Pérez', 'normal', '20', '10', '50'],
            ['María', 'López Rodríguez', 'mejorada', '18', '8', '50'],
            ['Carlos', 'Martínez Sánchez', 'normal', '22', '15', '50']
        ];
        
        // Plantilla de alimentos
        const foodsTemplate = [
            ['Nombre', 'Categoria'],
            ['Manzana', 'frutas'],
            ['Plátano', 'frutas'],
            ['Pollo', 'carnes'],
            ['Salmón', 'pescados']
        ];
        
        // Crear workbook con dos hojas
        const wb = XLSX.utils.book_new();
        
        const ws1 = XLSX.utils.aoa_to_sheet(workersTemplate);
        const ws2 = XLSX.utils.aoa_to_sheet(foodsTemplate);
        
        XLSX.utils.book_append_sheet(wb, ws1, "Trabajadores");
        XLSX.utils.book_append_sheet(wb, ws2, "Alimentos");
        
        // Escribir el archivo
        XLSX.writeFile(wb, "Plantillas_Sistema_Alimentacion.xlsx");
        
        showStatus('✅ Plantillas de Excel descargadas correctamente', 'success');
    } catch (error) {
        console.error('Error descargando plantillas:', error);
        showStatus('❌ Error al descargar plantillas: ' + error.message, 'error');
    }
}

// Descargar plantilla de trabajadores
function downloadWorkersTemplate() {
    try {
        const template = [
            ['Nombre', 'Apellidos', 'TipoDieta', 'DiasTrabajados', 'Meriendas', 'PrecioMerienda'],
            ['Ejemplo: Juan', 'García Pérez', 'normal', '20', '10', '50'],
            ['Ejemplo: María', 'López Rodríguez', 'mejorada', '18', '8', '50']
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(template);
        XLSX.utils.book_append_sheet(wb, ws, "Trabajadores");
        
        XLSX.writeFile(wb, "Plantilla_Trabajadores.xlsx");
        showStatus('✅ Plantilla de Trabajadores descargada', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Descargar plantilla de alimentos
function downloadFoodsTemplate() {
    try {
        const template = [
            ['Nombre', 'Categoria'],
            ['Manzana', 'frutas'],
            ['Pollo', 'carnes'],
            ['Lechuga', 'verduras'],
            ['Yogur', 'lacteos']
        ];
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(template);
        XLSX.utils.book_append_sheet(wb, ws, "Alimentos");
        
        XLSX.writeFile(wb, "Plantilla_Alimentos.xlsx");
        showStatus('✅ Plantilla de Alimentos descargada', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Importar datos desde archivos
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const type = event.target.getAttribute('data-type');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            if (type === 'json') {
                importFromJSON(e.target.result);
            } else {
                // Para Excel
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (type === 'workers-excel') {
                    importWorkersFromExcel(workbook);
                } else if (type === 'foods-excel') {
                    importFoodsFromExcel(workbook);
                }
            }
            
            // Actualizar interfaz
            renderWorkers();
            renderFoodsCatalog();
            updateSummary();
            updateFoodUsageStats();
            saveDataToLocalStorage();
            
        } catch (error) {
            console.error('Error importando datos:', error);
            showStatus('❌ Error al importar los datos: ' + error.message, 'error');
        }
    };
    
    if (type === 'json') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
    
    // Limpiar el input de archivo
    event.target.value = '';
}

// Importar trabajadores desde Excel
function importWorkersFromExcel(workbook) {
    try {
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newWorkers = [];
        const headers = data[0] || [];
        
        // Encontrar índices de columnas
        const nameIndex = headers.findIndex(h => h.toString().toLowerCase().includes('nombre'));
        const surnameIndex = headers.findIndex(h => h.toString().toLowerCase().includes('apellido'));
        const dietIndex = headers.findIndex(h => h.toString().toLowerCase().includes('dieta'));
        const daysIndex = headers.findIndex(h => h.toString().toLowerCase().includes('dias'));
        const snacksIndex = headers.findIndex(h => h.toString().toLowerCase().includes('merienda'));
        const snackPriceIndex = headers.findIndex(h => h.toString().toLowerCase().includes('precio'));
        
        // Procesar filas de datos
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const worker = {
                id: nextWorkerId++,
                name: row[nameIndex] || '',
                surname: row[surnameIndex] || '',
                diet: (row[dietIndex] || 'normal').toString().toLowerCase(),
                days: parseInt(row[daysIndex]) || 0,
                snacks: parseInt(row[snacksIndex]) || 0,
                snackPrice: parseFloat(row[snackPriceIndex]) || 50,
                foods: []
            };
            
            // Validar dieta
            if (worker.diet !== 'normal' && worker.diet !== 'mejorada') {
                worker.diet = 'normal';
            }
            
            newWorkers.push(worker);
        }
        
        workers = newWorkers;
        showStatus('✅ Trabajadores importados desde Excel correctamente', 'success');
    } catch (error) {
        throw new Error('Formato de Excel incorrecto para trabajadores');
    }
}

// Importar alimentos desde Excel
function importFoodsFromExcel(workbook) {
    try {
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newFoods = [];
        const headers = data[0] || [];
        
        // Encontrar índices de columnas
        const nameIndex = headers.findIndex(h => h.toString().toLowerCase().includes('nombre'));
        const categoryIndex = headers.findIndex(h => h.toString().toLowerCase().includes('categor'));
        
        // Procesar filas de datos
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const food = {
                id: nextFoodId++,
                name: row[nameIndex] || '',
                category: (row[categoryIndex] || 'otros').toString().toLowerCase()
            };
            
            newFoods.push(food);
        }
        
        foodsCatalog = newFoods;
        showStatus('✅ Alimentos importados desde Excel correctamente', 'success');
    } catch (error) {
        throw new Error('Formato de Excel incorrecto para alimentos');
    }
}

// Importar desde JSON
function importFromJSON(jsonContent) {
    try {
        const data = JSON.parse(jsonContent);
        
        if (data.workers) {
            workers = data.workers;
            if (workers.length > 0) {
                nextWorkerId = Math.max(...workers.map(w => w.id)) + 1;
            }
        }
        
        if (data.foodsCatalog) {
            foodsCatalog = data.foodsCatalog;
            if (foodsCatalog.length > 0) {
                nextFoodId = Math.max(...foodsCatalog.map(f => f.id)) + 1;
            }
        }
        
        showStatus('✅ Datos importados desde JSON correctamente', 'success');
    } catch (error) {
        throw new Error('Formato JSON incorrecto');
    }
}

// Exportar todos los datos a Excel (archivo completo)
function exportAllToExcel() {
    try {
        // Crear workbook con múltiples hojas
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Trabajadores CON ALIMENTOS Y TIENDA
        const workersData = [
            ['Nombre', 'Apellidos', 'Tipo Dieta', 'Días Trabajados', 'Meriendas', 'Precio Merienda', 'Presupuesto Diario', 'Presupuesto Total', 'Gasto Alimentos', 'Alimentos Comprados (Detalle)', 'Tienda']
        ];
        
        workers.forEach(worker => {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            const totalBudget = (dailyBudget * worker.days) + snackBudget;
            const foodExpense = calculateWorkerFoodExpense(worker);
            
            // Crear lista detallada de alimentos con tienda
            let detalleAlimentos = "";
            if (worker.foods.length > 0) {
                const alimentosDetalle = worker.foods.map(food => {
                    const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                    return `${food.name} (${food.quantity} x $${food.price.toFixed(2)}) - ${storeName}`;
                });
                detalleAlimentos = alimentosDetalle.join('; ');
            } else {
                detalleAlimentos = "Sin alimentos";
            }
            
            workersData.push([
                worker.name,
                worker.surname,
                getDietDisplayName(worker.diet),
                worker.days,
                worker.snacks || 0,
                `$${(worker.snackPrice || 50).toFixed(2)}`,
                `$${dailyBudget.toFixed(2)}`,
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                detalleAlimentos,
                "Varias tiendas"
            ]);
        });
        
        const ws1 = XLSX.utils.aoa_to_sheet(workersData);
        
        // Hoja 2: Resumen con alimentos (nueva)
        const summaryWithFoodsData = [
            ['RESUMEN GENERAL CON ALIMENTOS'],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['Trabajador', 'Presupuesto', 'Gasto Alimentos', 'Saldo', 'Alimentos Principales', 'Tienda Principal', 'Cantidad Total Items']
        ];
        
        workers.forEach(worker => {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            const totalBudget = (dailyBudget * worker.days) + snackBudget;
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            
            // Obtener los 3 alimentos principales (por gasto) y tienda más usada
            let alimentosPrincipales = "";
            let tiendaPrincipal = "";
            let cantidadTotal = 0;
            
            if (worker.foods.length > 0) {
                // Agrupar alimentos por nombre
                const alimentosAgrupados = {};
                const tiendas = {};
                
                worker.foods.forEach(food => {
                    cantidadTotal += food.quantity;
                    
                    // Contar tiendas
                    tiendas[food.store] = (tiendas[food.store] || 0) + 1;
                    
                    if (alimentosAgrupados[food.name]) {
                        alimentosAgrupados[food.name].cantidad += food.quantity;
                        alimentosAgrupados[food.name].gasto += food.quantity * food.price;
                    } else {
                        alimentosAgrupados[food.name] = {
                            cantidad: food.quantity,
                            gasto: food.quantity * food.price
                        };
                    }
                });
                
                // Ordenar por gasto descendente
                const alimentosOrdenados = Object.entries(alimentosAgrupados)
                    .sort((a, b) => b[1].gasto - a[1].gasto)
                    .slice(0, 3);
                
                alimentosPrincipales = alimentosOrdenados
                    .map(([nombre, datos]) => `${nombre} ($${datos.gasto.toFixed(2)})`)
                    .join(', ');
                
                // Encontrar tienda más usada
                const tiendaMasUsada = Object.entries(tiendas)
                    .sort((a, b) => b[1] - a[1])[0];
                tiendaPrincipal = tiendaMasUsada ? (tiendaMasUsada[0] === 'kaniki' ? 'Kaniki' : 'Punta Brava') : "N/A";
            } else {
                alimentosPrincipales = "Sin alimentos";
                tiendaPrincipal = "N/A";
            }
            
            summaryWithFoodsData.push([
                `${worker.name} ${worker.surname}`,
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                `$${remaining.toFixed(2)}`,
                alimentosPrincipales,
                tiendaPrincipal,
                cantidadTotal
            ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(summaryWithFoodsData);
        
        // Hoja 3: Alimentos (mantenida)
        const foodsData = [
            ['ID', 'Nombre', 'Categoría', 'Precio Promedio', 'Total Usos']
        ];
        
        foodsCatalog.forEach(food => {
            const usage = calculateFoodUsage(food.id);
            foodsData.push([
                food.id,
                food.name,
                getCategoryDisplayName(food.category),
                `$${usage.averagePrice.toFixed(2)}`,
                usage.totalQuantity
            ]);
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(foodsData);
        
        // Agregar hojas al workbook
        XLSX.utils.book_append_sheet(wb, ws1, "Trabajadores");
        XLSX.utils.book_append_sheet(wb, ws2, "Resumen con Alimentos");
        XLSX.utils.book_append_sheet(wb, ws3, "Catálogo Alimentos");
        
        // Escribir el archivo
        XLSX.writeFile(wb, `Sistema_Alimentacion_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showStatus('✅ Todos los datos exportados a Excel con alimentos incluidos', 'success');
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showStatus('❌ Error al exportar a Excel: ' + error.message, 'error');
    }
}

// Exportar resumen a Excel CON ALIMENTOS Y TIENDA
function exportSummaryToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        const summaryData = [
            ['RESUMEN DE ALIMENTACIÓN - ' + new Date().toLocaleDateString()],
            [''],
            ['Total Trabajadores', workers.length],
            ['Presupuesto Total', `$${calculateTotalBudget().toFixed(2)}`],
            ['Gasto Total en Alimentos', `$${calculateTotalFoodExpense().toFixed(2)}`],
            ['Saldo Total Restante', `$${calculateTotalRemaining().toFixed(2)}`],
            [''],
            ['DETALLE POR TRABAJADOR'],
            ['Nombre', 'Tipo Dieta', 'Días', 'Meriendas', 'Presupuesto', 'Gasto Alimentos', 'Saldo', '% Utilizado', 'Alimentos Comprados', 'Tienda']
        ];
        
        workers.forEach(worker => {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            const totalBudget = (dailyBudget * worker.days) + snackBudget;
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            const percentUsed = totalBudget > 0 ? ((foodExpense / totalBudget) * 100) : 0;
            
            // Crear lista de alimentos comprados
            let alimentosComprimidos = "";
            let tiendaInfo = "";
            
            if (worker.foods.length > 0) {
                const alimentosAgrupados = {};
                const tiendasUsadas = new Set();
                
                // Agrupar alimentos por nombre para comprimir la lista
                worker.foods.forEach(food => {
                    tiendasUsadas.add(food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava');
                    
                    if (alimentosAgrupados[food.name]) {
                        alimentosAgrupados[food.name].cantidad += food.quantity;
                        alimentosAgrupados[food.name].subtotal += food.quantity * food.price;
                    } else {
                        alimentosAgrupados[food.name] = {
                            cantidad: food.quantity,
                            subtotal: food.quantity * food.price
                        };
                    }
                });
                
                // Crear string comprimido
                const alimentosArray = [];
                for (const [nombre, datos] of Object.entries(alimentosAgrupados)) {
                    alimentosArray.push(`${nombre} (${datos.cantidad}x = $${datos.subtotal.toFixed(2)})`);
                }
                
                alimentosComprimidos = alimentosArray.join('; ');
                tiendaInfo = Array.from(tiendasUsadas).join(', ');
                
                // Limitar longitud si es muy largo
                if (alimentosComprimidos.length > 100) {
                    alimentosComprimidos = alimentosComprimidos.substring(0, 97) + '...';
                }
            } else {
                alimentosComprimidos = "Sin alimentos comprados";
                tiendaInfo = "N/A";
            }
            
            summaryData.push([
                `${worker.name} ${worker.surname}`,
                getDietDisplayName(worker.diet),
                worker.days,
                worker.snacks || 0,
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                `$${remaining.toFixed(2)}`,
                `${percentUsed.toFixed(1)}%`,
                alimentosComprimidos,
                tiendaInfo
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws, "Resumen");
        
        XLSX.writeFile(wb, `Resumen_Alimentacion_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Resumen exportado a Excel correctamente', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar reporte completo a Excel CON DETALLE DE ALIMENTOS Y TIENDA
function exportFullReportToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Trabajadores con detalles Y ALIMENTOS CON TIENDA
        const workersData = [
            ['INFORME COMPLETO DE TRABAJADORES'],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['ID', 'Nombre', 'Apellidos', 'Tipo Dieta', 'Días', 'Meriendas', 'Precio Merienda', 'Presupuesto Diario', 'Presupuesto Total', 'Gasto Alimentos', 'Saldo', 'Lista de Alimentos', 'Tienda']
        ];
        
        workers.forEach(worker => {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            const totalBudget = (dailyBudget * worker.days) + snackBudget;
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            
            // Crear lista detallada de alimentos con tienda
            let listaAlimentos = "";
            let tiendasUsadas = new Set();
            
            if (worker.foods.length > 0) {
                const alimentosDetalle = worker.foods.map(food => {
                    const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                    tiendasUsadas.add(storeName);
                    return `${food.name}: ${food.quantity} x $${food.price.toFixed(2)} = $${(food.quantity * food.price).toFixed(2)} (${storeName})`;
                });
                listaAlimentos = alimentosDetalle.join('\n');
            } else {
                listaAlimentos = "Sin alimentos registrados";
            }
            
            workersData.push([
                worker.id,
                worker.name,
                worker.surname,
                getDietDisplayName(worker.diet),
                worker.days,
                worker.snacks || 0,
                `$${(worker.snackPrice || 50).toFixed(2)}`,
                `$${dailyBudget.toFixed(2)}`,
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                `$${remaining.toFixed(2)}`,
                listaAlimentos,
                Array.from(tiendasUsadas).join(', ')
            ]);
        });
        
        const ws1 = XLSX.utils.aoa_to_sheet(workersData);
        
        // Hoja 2: Detalle EXTENDIDO de compras por trabajador CON TIENDA
        const purchasesData = [
            ['DETALLE EXTENDIDO DE COMPRAS POR TRABAJADOR'],
            [''],
            ['Trabajador', 'Alimento', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Categoría', 'Tienda', 'Fecha Registro']
        ];
        
        workers.forEach(worker => {
            worker.foods.forEach(food => {
                const foodInfo = foodsCatalog.find(f => f.id === food.id);
                const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                purchasesData.push([
                    `${worker.name} ${worker.surname}`,
                    food.name,
                    food.quantity,
                    `$${food.price.toFixed(2)}`,
                    `$${(food.quantity * food.price).toFixed(2)}`,
                    foodInfo ? getCategoryDisplayName(foodInfo.category) : 'Desconocida',
                    storeName,
                    new Date().toLocaleDateString()
                ]);
            });
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(purchasesData);
        
        // Hoja 3: Resumen de alimentos por trabajador CON TIENDA
        const foodSummaryData = [
            ['RESUMEN DE ALIMENTOS POR TRABAJADOR'],
            [''],
            ['Trabajador', 'Total Alimentos Diferentes', 'Cantidad Total Items', 'Gasto Total', 'Tienda Principal', 'Detalle de Alimentos']
        ];
        
        workers.forEach(worker => {
            const alimentosUnicos = [...new Set(worker.foods.map(f => f.name))];
            const cantidadTotal = worker.foods.reduce((sum, food) => sum + food.quantity, 0);
            const gastoTotal = calculateWorkerFoodExpense(worker);
            
            // Agrupar por tienda
            const tiendas = {};
            worker.foods.forEach(food => {
                const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                tiendas[storeName] = (tiendas[storeName] || 0) + 1;
            });
            
            const tiendaPrincipal = Object.entries(tiendas)
                .sort((a, b) => b[1] - a[1])[0];
            
            // Crear detalle compacto
            const alimentosAgrupados = {};
            worker.foods.forEach(food => {
                if (alimentosAgrupados[food.name]) {
                    alimentosAgrupados[food.name].cantidad += food.quantity;
                    alimentosAgrupados[food.name].subtotal += food.quantity * food.price;
                } else {
                    alimentosAgrupados[food.name] = {
                        cantidad: food.quantity,
                        subtotal: food.quantity * food.price
                    };
                }
            });
            
            const detalleCompacto = Object.entries(alimentosAgrupados)
                .map(([nombre, datos]) => `${nombre}: ${datos.cantidad}u ($${datos.subtotal.toFixed(2)})`)
                .join('; ');
            
            foodSummaryData.push([
                `${worker.name} ${worker.surname}`,
                alimentosUnicos.length,
                cantidadTotal,
                `$${gastoTotal.toFixed(2)}`,
                tiendaPrincipal ? tiendaPrincipal[0] : "N/A",
                detalleCompacto
            ]);
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(foodSummaryData);
        
        // Hoja 4: Estadísticas de alimentos (mantenida igual)
        const statsData = [
            ['ESTADÍSTICAS DE ALIMENTOS'],
            [''],
            ['Alimento', 'Categoría', 'Total Usos', 'Cantidad Total', 'Gasto Total', 'Precio Promedio']
        ];
        
        foodsCatalog.forEach(food => {
            const usage = calculateFoodUsage(food.id);
            statsData.push([
                food.name,
                getCategoryDisplayName(food.category),
                usage.totalUses,
                usage.totalQuantity,
                `$${usage.totalExpense.toFixed(2)}`,
                `$${usage.averagePrice.toFixed(2)}`
            ]);
        });
        
        const ws4 = XLSX.utils.aoa_to_sheet(statsData);
        
        // Nombrar las hojas apropiadamente
        XLSX.utils.book_append_sheet(wb, ws1, "Trabajadores Completo");
        XLSX.utils.book_append_sheet(wb, ws2, "Detalle Compras");
        XLSX.utils.book_append_sheet(wb, ws3, "Resumen Alimentos");
        XLSX.utils.book_append_sheet(wb, ws4, "Estadísticas");
        
        // Ajustar anchos de columnas automáticamente
        const wscols = [
            {wch: 5},   // ID
            {wch: 15},  // Nombre
            {wch: 15},  // Apellidos
            {wch: 12},  // Tipo Dieta
            {wch: 8},   // Días
            {wch: 10},  // Meriendas
            {wch: 15},  // Precio Merienda
            {wch: 18},  // Presupuesto Diario
            {wch: 16},  // Presupuesto Total
            {wch: 15},  // Gasto Alimentos
            {wch: 12},  // Saldo
            {wch: 50},  // Lista de Alimentos
            {wch: 15}   // Tienda
        ];
        ws1['!cols'] = wscols;
        
        XLSX.writeFile(wb, `Reporte_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Reporte completo exportado a Excel con detalles de alimentos y tienda', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar detalles por trabajador a Excel CON TIENDA
function exportDetailedReportToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        workers.forEach(worker => {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            const totalBudget = (dailyBudget * worker.days) + snackBudget;
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            
            const workerData = [
                [`INFORME DETALLADO: ${worker.name} ${worker.surname}`],
                ['Fecha', new Date().toLocaleDateString()],
                [''],
                ['INFORMACIÓN GENERAL'],
                ['Tipo de Alimentación', getDietDisplayName(worker.diet)],
                ['Días Trabajados', worker.days],
                ['Meriendas', worker.snacks || 0],
                ['Precio por Merienda', `$${(worker.snackPrice || 50).toFixed(2)}`],
                ['Presupuesto Diario', `$${dailyBudget.toFixed(2)}`],
                ['Presupuesto Total', `$${totalBudget.toFixed(2)}`],
                ['Gasto en Alimentos', `$${foodExpense.toFixed(2)}`],
                ['Saldo Restante', `$${remaining.toFixed(2)}`],
                ['Porcentaje Utilizado', `${totalBudget > 0 ? ((foodExpense / totalBudget) * 100).toFixed(1) : 0}%`],
                [''],
                ['LISTA DE COMPRAS CON TIENDA'],
                ['Alimento', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Tienda']
            ];
            
            worker.foods.forEach(food => {
                const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                workerData.push([
                    food.name,
                    food.quantity,
                    `$${food.price.toFixed(2)}`,
                    `$${(food.quantity * food.price).toFixed(2)}`,
                    storeName
                ]);
            });
            
            workerData.push(['', '', '', 'TOTAL:', `$${foodExpense.toFixed(2)}`, '']);
            
            const ws = XLSX.utils.aoa_to_sheet(workerData);
            const sheetName = `${worker.name.substring(0, 10)}_${worker.surname.substring(0, 10)}`.replace(/\s+/g, '_');
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        XLSX.writeFile(wb, `Detalles_Trabajadores_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Reportes detallados exportados a Excel', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar un trabajador específico a Excel CON TIENDA
function exportWorkerToExcel(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    try {
        const wb = XLSX.utils.book_new();
        
        const dailyBudget = dietPrices[worker.diet] || 0;
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        const totalBudget = (dailyBudget * worker.days) + snackBudget;
        const foodExpense = calculateWorkerFoodExpense(worker);
        const remaining = totalBudget - foodExpense;
        
        const workerData = [
            [`INFORME DE ALIMENTACIÓN: ${worker.name} ${worker.surname}`],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['INFORMACIÓN GENERAL'],
            ['Nombre', worker.name],
            ['Apellidos', worker.surname],
            ['Tipo de Alimentación', getDietDisplayName(worker.diet)],
            ['Días Trabajados', worker.days],
            ['Meriendas', worker.snacks || 0],
            ['Precio por Merienda', `$${(worker.snackPrice || 50).toFixed(2)}`],
            ['Presupuesto Diario', `$${dailyBudget.toFixed(2)}`],
            ['Presupuesto Total', `$${totalBudget.toFixed(2)}`],
            [''],
            ['RESUMEN FINANCIERO'],
            ['Gasto en Alimentos', `$${foodExpense.toFixed(2)}`],
            ['Saldo Restante', `$${remaining.toFixed(2)}`],
            ['Porcentaje Utilizado', `${totalBudget > 0 ? ((foodExpense / totalBudget) * 100).toFixed(1) : 0}%`],
            [''],
            ['DETALLE DE COMPRAS CON TIENDA'],
            ['Alimento', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Tienda']
        ];
        
        worker.foods.forEach(food => {
            const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
            workerData.push([
                food.name,
                food.quantity,
                `$${food.price.toFixed(2)}`,
                `$${(food.quantity * food.price).toFixed(2)}`,
                storeName
            ]);
        });
        
        workerData.push(['', '', '', 'TOTAL:', `$${foodExpense.toFixed(2)}`, '']);
        
        const ws = XLSX.utils.aoa_to_sheet(workerData);
        XLSX.utils.book_append_sheet(wb, ws, "Informe");
        
        XLSX.writeFile(wb, `Informe_${worker.name}_${worker.surname}_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus(`✅ Informe de ${worker.name} exportado a Excel`, 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Nueva función: Exportar resumen específico con alimentos y tienda
function exportFoodSummaryToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        const foodSummaryData = [
            ['RESUMEN DE ALIMENTOS COMPRADOS POR TRABAJADOR'],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['Trabajador', 'Total Alimentos', 'Items Totales', 'Gasto Total', 'Tienda', 'Detalle de Alimentos Comprados']
        ];
        
        workers.forEach(worker => {
            if (worker.foods.length === 0) {
                foodSummaryData.push([
                    `${worker.name} ${worker.surname}`,
                    '0',
                    '0',
                    '$0.00',
                    'N/A',
                    'Sin alimentos comprados'
                ]);
                return;
            }
            
            // Agrupar alimentos para resumen compacto
            const alimentosAgrupados = {};
            let itemsTotales = 0;
            const tiendasUsadas = new Set();
            
            worker.foods.forEach(food => {
                itemsTotales += food.quantity;
                tiendasUsadas.add(food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava');
                
                if (alimentosAgrupados[food.name]) {
                    alimentosAgrupados[food.name].cantidad += food.quantity;
                    alimentosAgrupados[food.name].subtotal += food.quantity * food.price;
                } else {
                    alimentosAgrupados[food.name] = {
                        cantidad: food.quantity,
                        subtotal: food.quantity * food.price
                    };
                }
            });
            
            // Crear detalle formateado
            const detalleAlimentos = Object.entries(alimentosAgrupados)
                .map(([nombre, datos]) => 
                    `${nombre}: ${datos.cantidad} unidad${datos.cantidad > 1 ? 'es' : ''} = $${datos.subtotal.toFixed(2)}`
                )
                .join('\n');
            
            const gastoTotal = calculateWorkerFoodExpense(worker);
            const alimentosUnicos = Object.keys(alimentosAgrupados).length;
            const tiendaInfo = Array.from(tiendasUsadas).join(', ');
            
            foodSummaryData.push([
                `${worker.name} ${worker.surname}`,
                alimentosUnicos,
                itemsTotales,
                `$${gastoTotal.toFixed(2)}`,
                tiendaInfo,
                detalleAlimentos
            ]);
        });
        
        // Agregar totales generales
        foodSummaryData.push(['']);
        foodSummaryData.push(['TOTALES GENERALES']);
        
        const totalAlimentos = workers.reduce((sum, worker) => 
            sum + [...new Set(worker.foods.map(f => f.name))].length, 0
        );
        
        const totalItems = workers.reduce((sum, worker) => 
            sum + worker.foods.reduce((s, f) => s + f.quantity, 0), 0
        );
        
        const totalGasto = calculateTotalFoodExpense();
        
        foodSummaryData.push([
            'TODOS LOS TRABAJADORES',
            totalAlimentos,
            totalItems,
            `$${totalGasto.toFixed(2)}`,
            'Todas las tiendas',
            `Gasto total en alimentos de todos los trabajadores`
        ]);
        
        const ws = XLSX.utils.aoa_to_sheet(foodSummaryData);
        
        // Ajustar anchos de columnas
        ws['!cols'] = [
            {wch: 25},  // Trabajador
            {wch: 15},  // Total Alimentos
            {wch: 15},  // Items Totales
            {wch: 15},  // Gasto Total
            {wch: 20},  // Tienda
            {wch: 60}   // Detalle de Alimentos
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Resumen Alimentos");
        
        XLSX.writeFile(wb, `Resumen_Alimentos_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Resumen de alimentos exportado a Excel', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar a JSON
function exportToJSON() {
    try {
        const data = {
            workers: workers,
            foodsCatalog: foodsCatalog
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `datos_alimentacion_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus('✅ Datos exportados a JSON correctamente', 'success');
    } catch (error) {
        console.error('Error exportando a JSON:', error);
        showStatus('❌ Error al exportar a JSON: ' + error.message, 'error');
    }
}

// ==================== FUNCIONES DE CÁLCULO ====================

// Calcular uso de alimentos
function calculateFoodUsage(foodId) {
    let totalQuantity = 0;
    let totalExpense = 0;
    let totalUses = 0;
    
    workers.forEach(worker => {
        worker.foods.forEach(food => {
            if (food.id === foodId) {
                totalQuantity += food.quantity;
                totalExpense += food.quantity * food.price;
                totalUses++;
            }
        });
    });
    
    return {
        totalQuantity,
        totalExpense,
        totalUses,
        averagePrice: totalQuantity > 0 ? totalExpense / totalQuantity : 0
    };
}

// Actualizar estadísticas de uso de alimentos
function updateFoodUsageStats() {
    foodsCatalog.forEach(food => {
        food.usage = calculateFoodUsage(food.id);
    });
}

// Calcular gasto de un trabajador
function calculateWorkerFoodExpense(worker) {
    return worker.foods.reduce((total, food) => total + (food.quantity * food.price), 0);
}

// Calcular presupuesto total
function calculateTotalBudget() {
    return workers.reduce((total, worker) => {
        const dailyBudget = dietPrices[worker.diet] || 0;
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        return total + (dailyBudget * worker.days) + snackBudget;
    }, 0);
}

// Calcular gasto total en alimentos
function calculateTotalFoodExpense() {
    return workers.reduce((total, worker) => total + calculateWorkerFoodExpense(worker), 0);
}

// Calcular saldo total restante
function calculateTotalRemaining() {
    return calculateTotalBudget() - calculateTotalFoodExpense();
}

// ==================== FUNCIONES DE INTERFAZ ====================

// Mostrar mensajes de estado
function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.style.display = 'block';
    
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 5000);
}

// Restablecer datos
function resetData() {
    if (confirm('⚠️ ¿Estás seguro de que quieres restablecer todos los datos?\n\nSe perderá toda la información actual y se cargarán datos de ejemplo.')) {
        localStorage.removeItem('foodManagementData');
        initializeWithSampleData();
        showStatus('✅ Datos restablecidos correctamente', 'success');
    }
}

// ==================== FUNCIONES DE RENDERIZADO ====================

// Renderizar lista de trabajadores
function renderWorkers() {
    const workersList = document.getElementById('workers-list');
    workersList.innerHTML = '';
    
    workers.forEach(worker => {
        const dailyBudget = dietPrices[worker.diet] || 0;
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        const totalBudget = (dailyBudget * worker.days) + snackBudget;
        const foodExpense = calculateWorkerFoodExpense(worker);
        const remaining = totalBudget - foodExpense;
        const percentUsed = totalBudget > 0 ? ((foodExpense / totalBudget) * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${worker.name}</strong></td>
            <td>${worker.surname}</td>
            <td><span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span></td>
            <td>${worker.days}</td>
            <td>${worker.snacks || 0}</td>
            <td>$${dailyBudget.toFixed(2)}</td>
            <td>
                <strong>$${totalBudget.toFixed(2)}</strong>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentUsed, 100)}%"></div>
                </div>
                <small>${percentUsed.toFixed(1)}% usado</small>
            </td>
            <td>
                <button class="btn-view" data-id="${worker.id}">👁️ Ver</button>
                <button class="btn-edit" data-id="${worker.id}">✏️ Editar</button>
                <button class="btn-danger" data-id="${worker.id}">🗑️ Eliminar</button>
            </td>
        `;
        
        workersList.appendChild(row);
    });
    
    // Event listeners para botones de trabajadores
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const workerId = parseInt(this.dataset.id);
            showWorkerDetails(workerId);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const workerId = parseInt(this.dataset.id);
            openWorkerModal(workerId);
        });
    });
    
    document.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const workerId = parseInt(this.dataset.id);
            deleteWorker(workerId);
        });
    });
}

// Renderizar catálogo de alimentos
function renderFoodsCatalog() {
    const foodsCatalogList = document.getElementById('foods-catalog-list');
    foodsCatalogList.innerHTML = '';
    
    foodsCatalog.forEach(food => {
        const usage = calculateFoodUsage(food.id);
        const categoryInfo = foodCategories[food.category] || foodCategories.otros;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${food.id}</td>
            <td><strong>${food.name}</strong></td>
            <td>
                <span class="category-badge" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color}; border: 1px solid ${categoryInfo.color}40;">
                    ${categoryInfo.name}
                </span>
            </td>
            <td>$${usage.averagePrice.toFixed(2)}</td>
            <td>
                <button class="btn-danger" data-id="${food.id}">🗑️ Eliminar</button>
            </td>
        `;
        
        foodsCatalogList.appendChild(row);
    });
    
    // Event listeners para botones de eliminar alimentos
    document.querySelectorAll('#foods-catalog-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const foodId = parseInt(this.dataset.id);
            deleteFoodCatalog(foodId);
        });
    });
    
    // Actualizar selector de alimentos para trabajadores
    updateFoodSelect();
}

// Actualizar selector de alimentos
function updateFoodSelect() {
    const foodSelect = document.getElementById('food-select');
    foodSelect.innerHTML = '';
    
    foodsCatalog.forEach(food => {
        const option = document.createElement('option');
        option.value = food.id;
        option.textContent = `${food.name} (${getCategoryDisplayName(food.category)})`;
        foodSelect.appendChild(option);
    });
}

// Mostrar detalles del trabajador
function showWorkerDetails(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    currentWorkerId = workerId;
    
    // Mostrar sección de detalles
    const workerDetails = document.getElementById('worker-details');
    workerDetails.style.display = 'block';
    
    // Scroll a la sección de detalles
    workerDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Actualizar información del trabajador
    const workerInfo = document.getElementById('worker-info');
    const dailyBudget = dietPrices[worker.diet] || 0;
    const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
    const totalBudget = (dailyBudget * worker.days) + snackBudget;
    const foodExpense = calculateWorkerFoodExpense(worker);
    const remaining = totalBudget - foodExpense;
    const percentUsed = totalBudget > 0 ? ((foodExpense / totalBudget) * 100) : 0;
    
    workerInfo.innerHTML = `
        <div class="worker-header">
            <h3>${worker.name} ${worker.surname}</h3>
            <span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span>
        </div>
        <div class="worker-stats">
            <div class="stat-item">
                <div class="stat-label">📅 Días Trabajados</div>
                <div class="stat-value">${worker.days}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">🍎 Meriendas</div>
                <div class="stat-value">${worker.snacks || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">💰 Precio por Merienda</div>
                <div class="stat-value">$${(worker.snackPrice || 50).toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">💵 Presupuesto Diario</div>
                <div class="stat-value">$${dailyBudget.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">🏦 Presupuesto Total</div>
                <div class="stat-value">$${totalBudget.toFixed(2)}</div>
            </div>
        </div>
        <div class="progress-container">
            <div class="progress-info">
                <span>Presupuesto utilizado: ${percentUsed.toFixed(1)}%</span>
                <span>$${foodExpense.toFixed(2)} de $${totalBudget.toFixed(2)}</span>
            </div>
            <div class="progress-bar large">
                <div class="progress-fill" style="width: ${Math.min(percentUsed, 100)}%"></div>
            </div>
        </div>
    `;
    
    // Renderizar lista de alimentos del trabajador
    renderWorkerFoods(worker);
    
    // Actualizar resumen
    updateWorkerSummary(worker);
}

// Renderizar alimentos de un trabajador CON TIENDA
function renderWorkerFoods(worker) {
    const foodList = document.getElementById('food-list');
    foodList.innerHTML = '';
    
    let total = 0;
    
    worker.foods.forEach((food, index) => {
        const subtotal = food.quantity * food.price;
        total += subtotal;
        const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${food.name}</td>
            <td>${food.quantity}</td>
            <td>$${food.price.toFixed(2)}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td>${storeName}</td>
            <td>
                <button class="btn-danger btn-sm" data-index="${index}">🗑️</button>
            </td>
        `;
        
        foodList.appendChild(row);
    });
    
    // Actualizar total
    document.getElementById('food-total').textContent = `$${total.toFixed(2)}`;
    
    // Event listeners para botones de eliminar alimentos
    document.querySelectorAll('#food-list .btn-danger').forEach(btn => {
        btn.addEventListener('click', function() {
            const foodIndex = parseInt(this.dataset.index);
            removeFoodFromWorker(foodIndex);
        });
    });
}

// Actualizar resumen del trabajador
function updateWorkerSummary(worker) {
    const dailyBudget = dietPrices[worker.diet] || 0;
    const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
    const totalBudget = (dailyBudget * worker.days) + snackBudget;
    
    let foodExpense = 0;
    worker.foods.forEach(food => {
        foodExpense += food.quantity * food.price;
    });
    
    const remainingBudget = totalBudget - foodExpense;
    const percentUsed = totalBudget > 0 ? ((foodExpense / totalBudget) * 100) : 0;
    
    document.getElementById('budget-total').textContent = `$${totalBudget.toFixed(2)}`;
    document.getElementById('food-expense').textContent = `$${foodExpense.toFixed(2)}`;
    document.getElementById('remaining-budget').textContent = `$${remainingBudget.toFixed(2)}`;
    
    // Actualizar barra de progreso si existe
    const progressFill = document.querySelector('#worker-details .progress-fill');
    if (progressFill) {
        progressFill.style.width = `${Math.min(percentUsed, 100)}%`;
    }
}

// Actualizar resumen general CON NUEVA ESTRUCTURA
function updateSummary() {
    // Actualizar estadísticas generales
    const totalWorkers = workers.length;
    const totalBudget = calculateTotalBudget();
    const totalFoodExpense = calculateTotalFoodExpense();
    const totalRemaining = calculateTotalRemaining();
    
    document.getElementById('total-workers').textContent = totalWorkers;
    document.getElementById('total-budget').textContent = `$${totalBudget.toFixed(2)}`;
    document.getElementById('total-food-expense').textContent = `$${totalFoodExpense.toFixed(2)}`;
    document.getElementById('total-remaining').textContent = `$${totalRemaining.toFixed(2)}`;
    
    // Actualizar tabla de resumen expandida
    const summaryList = document.getElementById('summary-list');
    summaryList.innerHTML = '';
    
    workers.forEach(worker => {
        const dailyBudget = dietPrices[worker.diet] || 0;
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        const workerBudget = (dailyBudget * worker.days) + snackBudget;
        
        const workerFoodExpense = calculateWorkerFoodExpense(worker);
        const remaining = workerBudget - workerFoodExpense;
        const percentUsed = workerBudget > 0 ? ((workerFoodExpense / workerBudget) * 100) : 0;
        
        // Si el trabajador tiene alimentos
        if (worker.foods.length > 0) {
            worker.foods.forEach((food, index) => {
                const subtotal = food.quantity * food.price;
                const storeName = food.store === 'kaniki' ? 'Kaniki' : 'Punta Brava';
                
                const row = document.createElement('tr');
                
                if (index === 0) {
                    // Primera fila del trabajador - mostrar todos sus datos
                    row.innerHTML = `
                        <td rowspan="${worker.foods.length}" class="worker-name-cell">
                            <strong>${worker.name} ${worker.surname}</strong><br>
                            <span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span>
                        </td>
                        <td>${worker.days}</td>
                        <td>${worker.snacks || 0}</td>
                        <td>$${workerBudget.toFixed(2)}</td>
                        <td class="${remaining >= 0 ? 'positive' : 'negative'}">
                            $${remaining.toFixed(2)}<br>
                            <small>(${percentUsed.toFixed(1)}% usado)</small>
                        </td>
                        <td>${food.name}</td>
                        <td>${food.quantity}</td>
                        <td>$${food.price.toFixed(2)}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                        <td>${storeName}</td>
                    `;
                } else {
                    // Filas siguientes del mismo trabajador - solo mostrar detalles del alimento
                    row.innerHTML = `
                        <td>${worker.days}</td>
                        <td>${worker.snacks || 0}</td>
                        <td>$${workerBudget.toFixed(2)}</td>
                        <td class="${remaining >= 0 ? 'positive' : 'negative'}">
                            $${remaining.toFixed(2)}<br>
                            <small>(${percentUsed.toFixed(1)}% usado)</small>
                        </td>
                        <td>${food.name}</td>
                        <td>${food.quantity}</td>
                        <td>$${food.price.toFixed(2)}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                        <td>${storeName}</td>
                    `;
                }
                
                summaryList.appendChild(row);
            });
        } else {
            // Trabajador sin alimentos
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="worker-name-cell">
                    <strong>${worker.name} ${worker.surname}</strong><br>
                    <span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span>
                </td>
                <td>${worker.days}</td>
                <td>${worker.snacks || 0}</td>
                <td>$${workerBudget.toFixed(2)}</td>
                <td class="positive">$${remaining.toFixed(2)}</td>
                <td colspan="5" class="no-foods">Sin alimentos registrados</td>
            `;
            summaryList.appendChild(row);
        }
    });
}

// ==================== FUNCIONES DE MODALES ====================

// Abrir modal para añadir/editar trabajador
function openWorkerModal(workerId = null) {
    const modal = document.getElementById('worker-modal');
    const title = document.getElementById('worker-modal-title');
    const form = document.getElementById('worker-form');
    
    if (workerId) {
        // Modo edición
        title.textContent = '✏️ Editar Trabajador';
        const worker = workers.find(w => w.id === workerId);
        
        if (worker) {
            document.getElementById('worker-id').value = worker.id;
            document.getElementById('worker-name').value = worker.name;
            document.getElementById('worker-surname').value = worker.surname;
            document.getElementById('worker-diet').value = worker.diet;
            document.getElementById('worker-days').value = worker.days;
            document.getElementById('worker-snacks').value = worker.snacks || 0;
            document.getElementById('snack-price').value = worker.snackPrice || 50;
        }
    } else {
        // Modo añadir
        title.textContent = '➕ Añadir Trabajador';
        form.reset();
        document.getElementById('worker-id').value = '';
        document.getElementById('worker-snacks').value = 0;
        document.getElementById('snack-price').value = 50;
    }
    
    modal.style.display = 'flex';
}

// Guardar trabajador (añadir o editar)
function saveWorker() {
    const id = document.getElementById('worker-id').value;
    const name = document.getElementById('worker-name').value;
    const surname = document.getElementById('worker-surname').value;
    const diet = document.getElementById('worker-diet').value;
    const days = parseInt(document.getElementById('worker-days').value);
    const snacks = parseInt(document.getElementById('worker-snacks').value);
    const snackPrice = parseFloat(document.getElementById('snack-price').value);
    
    if (!name || !surname) {
        showStatus('❌ Por favor, completa todos los campos obligatorios', 'error');
        return;
    }
    
    if (id) {
        // Editar trabajador existente
        const workerIndex = workers.findIndex(w => w.id === parseInt(id));
        if (workerIndex !== -1) {
            workers[workerIndex].name = name;
            workers[workerIndex].surname = surname;
            workers[workerIndex].diet = diet;
            workers[workerIndex].days = days;
            workers[workerIndex].snacks = snacks;
            workers[workerIndex].snackPrice = snackPrice;
        }
    } else {
        // Añadir nuevo trabajador
        const newWorker = {
            id: nextWorkerId++,
            name: name,
            surname: surname,
            diet: diet,
            days: days,
            snacks: snacks,
            snackPrice: snackPrice,
            foods: []
        };
        workers.push(newWorker);
    }
    
    // Cerrar modal y actualizar interfaz
    document.getElementById('worker-modal').style.display = 'none';
    renderWorkers();
    updateSummary();
    saveDataToLocalStorage();
    
    // Si estamos viendo los detalles de este trabajador, actualizarlos
    if (currentWorkerId && (parseInt(id) === currentWorkerId || !id)) {
        if (!id) {
            // Si es nuevo, mostrar sus detalles
            showWorkerDetails(nextWorkerId - 1);
        } else {
            showWorkerDetails(parseInt(id));
        }
    }
    
    showStatus('✅ Trabajador guardado correctamente', 'success');
}

// Eliminar trabajador
function deleteWorker(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    if (confirm(`⚠️ ¿Estás seguro de que quieres eliminar a ${worker.name} ${worker.surname}?\n\nEsta acción no se puede deshacer.`)) {
        workers = workers.filter(w => w.id !== workerId);
        renderWorkers();
        updateSummary();
        saveDataToLocalStorage();
        
        // Si estamos viendo los detalles de este trabajador, ocultar la sección de detalles
        if (currentWorkerId === workerId) {
            document.getElementById('worker-details').style.display = 'none';
            currentWorkerId = null;
        }
        
        showStatus(`✅ Trabajador ${worker.name} eliminado correctamente`, 'success');
    }
}

// Abrir modal para añadir alimento al catálogo
function openFoodCatalogModal() {
    const modal = document.getElementById('food-catalog-modal');
    modal.style.display = 'flex';
}

// Guardar alimento en el catálogo
function saveFoodCatalog() {
    const name = document.getElementById('food-catalog-name').value;
    const category = document.getElementById('food-catalog-category').value;
    
    if (!name) {
        showStatus('❌ Por favor, introduce el nombre del alimento', 'error');
        return;
    }
    
    const newFood = {
        id: nextFoodId++,
        name: name,
        category: category
    };
    
    foodsCatalog.push(newFood);
    
    // Cerrar modal y actualizar interfaz
    document.getElementById('food-catalog-modal').style.display = 'none';
    document.getElementById('food-catalog-form').reset();
    renderFoodsCatalog();
    saveDataToLocalStorage();
    
    showStatus(`✅ Alimento "${name}" añadido al catálogo`, 'success');
}

// Eliminar alimento del catálogo
function deleteFoodCatalog(foodId) {
    const food = foodsCatalog.find(f => f.id === foodId);
    if (!food) return;
    
    if (confirm(`⚠️ ¿Estás seguro de que quieres eliminar el alimento "${food.name}"?\n\nEste alimento será eliminado de todas las listas de compra.`)) {
        foodsCatalog = foodsCatalog.filter(f => f.id !== foodId);
        renderFoodsCatalog();
        saveDataToLocalStorage();
        
        // También eliminar este alimento de todos los trabajadores
        workers.forEach(worker => {
            worker.foods = worker.foods.filter(f => f.id !== foodId);
        });
        
        // Si estamos viendo los detalles de un trabajador, actualizar su lista
        if (currentWorkerId) {
            const worker = workers.find(w => w.id === currentWorkerId);
            if (worker) {
                renderWorkerFoods(worker);
                updateWorkerSummary(worker);
            }
        }
        
        showStatus(`✅ Alimento "${food.name}" eliminado del catálogo`, 'success');
    }
}

// Añadir alimento a trabajador CON TIENDA
function addFoodToWorker() {
    if (!currentWorkerId) {
        showStatus('❌ Primero selecciona un trabajador', 'error');
        return;
    }
    
    const foodSelect = document.getElementById('food-select');
    const foodId = parseInt(foodSelect.value);
    const quantity = parseInt(document.getElementById('food-quantity').value);
    const price = parseFloat(document.getElementById('food-price').value);
    const store = document.getElementById('food-store').value;
    
    if (!foodId || !quantity || quantity < 1 || !price || price < 0) {
        showStatus('❌ Por favor, completa todos los campos correctamente', 'error');
        return;
    }
    
    const food = foodsCatalog.find(f => f.id === foodId);
    if (!food) {
        showStatus('❌ El alimento seleccionado no existe', 'error');
        return;
    }
    
    const worker = workers.find(w => w.id === currentWorkerId);
    if (!worker) {
        showStatus('❌ El trabajador seleccionado no existe', 'error');
        return;
    }
    
    // Añadir alimento al trabajador con tienda
    worker.foods.push({
        id: food.id,
        name: food.name,
        quantity: quantity,
        price: price,
        store: store
    });
    
    // Actualizar interfaz
    renderWorkerFoods(worker);
    updateWorkerSummary(worker);
    saveDataToLocalStorage();
    
    // Limpiar formulario
    document.getElementById('food-quantity').value = 1;
    document.getElementById('food-price').value = 0;
    
    showStatus(`✅ "${food.name}" añadido a la lista de compra`, 'success');
}

// Eliminar alimento de trabajador
function removeFoodFromWorker(foodIndex) {
    if (!currentWorkerId) return;
    
    const worker = workers.find(w => w.id === currentWorkerId);
    if (!worker || !worker.foods[foodIndex]) return;
    
    const foodName = worker.foods[foodIndex].name;
    
    worker.foods.splice(foodIndex, 1);
    
    // Actualizar interfaz
    renderWorkerFoods(worker);
    updateWorkerSummary(worker);
    saveDataToLocalStorage();
    
    showStatus(`✅ "${foodName}" eliminado de la lista de compra`, 'success');
}

// ==================== FUNCIONES AUXILIARES ====================

// Función auxiliar para mostrar nombre de dieta
function getDietDisplayName(diet) {
    const dietNames = {
        normal: 'Normal',
        mejorada: 'Mejorada'
    };
    return dietNames[diet] || diet;
}

// Función auxiliar para mostrar nombre de categoría
function getCategoryDisplayName(category) {
    const categoryInfo = foodCategories[category];
    return categoryInfo ? categoryInfo.name.replace(/[^a-zA-Z\s]/g, '') : 'Otros';
}

// ==================== FUNCIONES DE DEPURACIÓN ====================

// Mostrar información de depuración (opcional)
function debugInfo() {
    console.log('=== DEBUG INFO ===');
    console.log('Total trabajadores:', workers.length);
    console.log('Total alimentos:', foodsCatalog.length);
    console.log('Next Worker ID:', nextWorkerId);
    console.log('Next Food ID:', nextFoodId);
    console.log('Current Worker ID:', currentWorkerId);
    console.log('==================');
}

// Exportar función de depuración al global scope (opcional)
window.debugInfo = debugInfo;