// Variables globales para los datos
let workers = [];
let foodsCatalog = [];
let currentWorkerId = null;
let nextWorkerId = 1;
let nextFoodId = 1;

// Precios por tipo de alimentación (en pesos)
const dietPrices = {
    normal: 400,
    mejorada: 500,
    estimulo: 0 // Se maneja de forma diferente
};

// Nombres de tiendas
const storeNames = {
    kaniki: "Kaniki",
    punta_brava: "Punta Brava"
};

// Variables para control de guardado
let isSaving = false;
let saveRetryCount = 0;
const MAX_RETRIES = 3;

// ==================== INICIALIZACIÓN ====================

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Gestión de Alimentación iniciando...');
    
    try {
        loadDataFromLocalStorage();
        setupEventListeners();
        updateSummary();
        
        // Configurar guardados automáticos
        setupPeriodicSave();
        setupBeforeUnload();
        
        console.log('✅ Sistema iniciado correctamente');
    } catch (error) {
        console.error('❌ Error crítico al iniciar:', error);
        showStatus('⚠️ Error crítico. Contacte al administrador.', 'error');
    }
});

// ==================== FUNCIONES DE CARGA Y GUARDADO ====================

// Cargar datos desde localStorage con verificación mejorada
function loadDataFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('foodManagementData');
        
        if (savedData) {
            if (!verifyDataIntegrity()) {
                console.warn('Datos corruptos, intentando recuperar de backup...');
                if (restoreFromBackup()) {
                    return;
                }
                throw new Error('Datos corruptos y sin backup disponible');
            }
            
            const data = JSON.parse(savedData);
            workers = data.workers || [];
            foodsCatalog = data.foodsCatalog || [];
            nextWorkerId = data.nextWorkerId || 1;
            nextFoodId = data.nextFoodId || 1;
            
            // Validar IDs
            if (workers.length > 0) {
                const maxWorkerId = Math.max(...workers.map(w => w.id || 0));
                nextWorkerId = Math.max(nextWorkerId, maxWorkerId + 1);
            }
            
            if (foodsCatalog.length > 0) {
                const maxFoodId = Math.max(...foodsCatalog.map(f => f.id || 0));
                nextFoodId = Math.max(nextFoodId, maxFoodId + 1);
            }
            
            renderWorkers();
            renderFoodsCatalog();
            updateSummary();
            
            const saveCount = data.saveCount || 0;
            const lastSave = data.lastSave ? new Date(data.lastSave).toLocaleString() : 'Desconocida';
            
            console.log(`📊 Datos cargados: ${workers.length} trabajadores, ${foodsCatalog.length} alimentos`);
            console.log(`💾 Último guardado: ${lastSave} (${saveCount} guardados totales)`);
            
            showStatus(`✅ Datos cargados (${workers.length} trabajadores, ${foodsCatalog.length} alimentos)`, 'success');
        } else {
            initializeWithSampleData();
        }
    } catch (error) {
        console.error('Error crítico cargando datos:', error);
        
        // Intentar recuperar de backup
        if (!restoreFromBackup()) {
            showStatus('⚠️ Error cargando datos. Iniciando con datos de ejemplo.', 'error');
            initializeWithSampleData();
        }
    }
}

// Inicializar con datos de ejemplo
function initializeWithSampleData() {
    workers = [
        { 
            id: 1, 
            name: "Juan", 
            surname: "García Pérez", 
            diet: "normal", 
            kanikiDays: 15,
            puntabravaDays: 5,
            snacks: 10, 
            snackPrice: 50,
            stimulusBalance: 0,
            foods: [
                { id: 1, name: "Aceite", quantity: 2, price: 850, store: "kaniki" },
                { id: 3, name: "Pollo Pqte 2Kg", quantity: 1, price: 1650, store: "kaniki" }
            ]
        },
        { 
            id: 2, 
            name: "María", 
            surname: "López Rodríguez", 
            diet: "mejorada", 
            kanikiDays: 10,
            puntabravaDays: 8,
            snacks: 8, 
            snackPrice: 50,
            stimulusBalance: 0,
            foods: [
                { id: 2, name: "Frijoles Negros", quantity: 3, price: 380, store: "kaniki" },
                { id: 5, name: "Leche Condensada Silver Food", quantity: 2, price: 470, store: "kaniki" }
            ]
        },
        { 
            id: 3, 
            name: "Carlos", 
            surname: "Martínez", 
            diet: "estimulo", 
            kanikiDays: 0,
            puntabravaDays: 0,
            snacks: 0, 
            snackPrice: 0,
            stimulusBalance: 1000,
            foods: []
        }
    ];
    
    foodsCatalog = [
        { id: 1, name: "Aceite", price: 850, store: "kaniki" },
        { id: 2, name: "Frijoles Negros", price: 380, store: "kaniki" },
        { id: 3, name: "Pollo Pqte 2Kg", price: 1650, store: "kaniki" },
        { id: 4, name: "Leche Condensada Silver Food", price: 470, store: "kaniki" },
        { id: 5, name: "Pasta Tomate", price: 800, store: "kaniki" },
        { id: 6, name: "Jamón Bravo 3Kg", price: 7000, store: "punta_brava" },
        { id: 7, name: "Chorizo", price: 2500, store: "punta_brava" },
        { id: 8, name: "Pelly", price: 200, store: "punta_brava" }
    ];
    
    nextWorkerId = 4;
    nextFoodId = 9;
    
    renderWorkers();
    renderFoodsCatalog();
    updateSummary();
    saveDataToLocalStorage();
    
    showStatus('✅ Sistema iniciado con datos de ejemplo', 'success');
}

// Guardar datos en localStorage con manejo de errores mejorado
function saveDataToLocalStorage() {
    if (isSaving) return; // Evitar múltiples guardados simultáneos
    
    try {
        isSaving = true;
        showSaveIndicator('saving');
        
        const data = {
            workers: workers,
            foodsCatalog: foodsCatalog,
            nextWorkerId: nextWorkerId,
            nextFoodId: nextFoodId,
            lastSave: new Date().toISOString(),
            saveCount: (getSaveCount() || 0) + 1
        };
        
        localStorage.setItem('foodManagementData', JSON.stringify(data));
        
        // Guardar también una copia de seguridad
        const backupData = {
            ...data,
            backupDate: new Date().toISOString()
        };
        localStorage.setItem('foodManagementBackup', JSON.stringify(backupData));
        
        saveRetryCount = 0;
        showSaveIndicator('success');
        
        // Log para depuración (opcional)
        console.log(`✅ Datos guardados: ${new Date().toLocaleTimeString()}`);
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        saveRetryCount++;
        
        if (saveRetryCount <= MAX_RETRIES) {
            console.log(`🔄 Reintentando guardado (${saveRetryCount}/${MAX_RETRIES})...`);
            setTimeout(saveDataToLocalStorage, 1000);
        } else {
            showSaveIndicator('error');
            showStatus('❌ Error crítico al guardar datos. Intenta exportar a Excel como respaldo.', 'error');
        }
    } finally {
        setTimeout(() => {
            isSaving = false;
            hideSaveIndicator();
        }, 1500);
    }
}

// ==================== FUNCIONES DE EXCEL ====================

// Descargar plantillas de Excel
function downloadExcelTemplates() {
    try {
        // Plantilla de trabajadores
        const workersTemplate = [
            ['Nombre', 'Apellidos', 'TipoDieta', 'DiasKaniki', 'DiasPuntaBrava', 'Meriendas', 'PrecioMerienda', 'Estímulo'],
            ['Juan', 'García Pérez', 'normal', '15', '5', '10', '50', ''],
            ['María', 'López Rodríguez', 'mejorada', '10', '8', '8', '50', ''],
            ['Carlos', 'Martínez', 'estimulo', '', '', '', '', '1000']
        ];
        
        // Plantilla de alimentos
        const foodsTemplate = [
            ['Nombre', 'Precio', 'Tienda'],
            ['Aceite', '850', 'kaniki'],
            ['Pollo Pqte 2Kg', '1650', 'kaniki'],
            ['Frijoles Negros', '380', 'kaniki'],
            ['Jamón Bravo 3Kg', '7000', 'punta_brava']
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

// Importar datos desde archivos Excel
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const type = event.target.getAttribute('data-type');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            if (type === 'workers-excel') {
                importWorkersFromExcel(workbook);
            } else if (type === 'foods-excel') {
                importFoodsFromExcel(workbook);
            }
            
            // Actualizar interfaz
            renderWorkers();
            renderFoodsCatalog();
            updateSummary();
            saveDataToLocalStorage();
            
        } catch (error) {
            console.error('Error importando datos:', error);
            showStatus('❌ Error al importar los datos: ' + error.message, 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
    
    // Limpiar el input de archivo
    event.target.value = '';
}

// Importar trabajadores desde Excel (MODIFICADO PARA NUEVOS CAMPOS)
function importWorkersFromExcel(workbook) {
    try {
        // Buscar la hoja "Trabajadores" por nombre
        let worksheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('trabajador') || 
            name.toLowerCase().includes('worker')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newWorkers = [];
        const headers = data[0] || [];
        
        // Encontrar índices de columnas
        const nameIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('nombre')
        );
        const surnameIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('apellido')
        );
        const dietIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('dieta') ||
            h && h.toString().toLowerCase().includes('tipo')
        );
        const kanikiDaysIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('kaniki') ||
            h && h.toString().toLowerCase().includes('díaskaniki')
        );
        const puntabravaDaysIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('puntabrava') ||
            h && h.toString().toLowerCase().includes('punta brava')
        );
        const snacksIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('merienda')
        );
        const snackPriceIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('precio')
        );
        const stimulusIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('estímulo') ||
            h && h.toString().toLowerCase().includes('estimulo')
        );
        
        // Procesar filas de datos
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            // Validar que haya al menos nombre
            if (!row[nameIndex]) continue;
            
            const worker = {
                id: nextWorkerId++,
                name: (row[nameIndex] || '').toString().trim(),
                surname: (row[surnameIndex] || '').toString().trim(),
                diet: (row[dietIndex] || 'normal').toString().toLowerCase(),
                kanikiDays: parseInt(row[kanikiDaysIndex]) || 0,
                puntabravaDays: parseInt(row[puntabravaDaysIndex]) || 0,
                snacks: parseInt(row[snacksIndex]) || 0,
                snackPrice: parseFloat(row[snackPriceIndex]) || 50,
                stimulusBalance: parseFloat(row[stimulusIndex]) || 0,
                foods: []
            };
            
            // Si tiene estímulo pero no está marcado como dieta estímulo, corregir
            if (worker.stimulusBalance > 0 && worker.diet !== 'estimulo') {
                worker.diet = 'estimulo';
                worker.kanikiDays = 0;
                worker.puntabravaDays = 0;
                worker.snacks = 0;
                worker.snackPrice = 0;
            }
            
            // Validar dieta
            if (!['normal', 'mejorada', 'estimulo'].includes(worker.diet)) {
                worker.diet = 'normal';
            }
            
            newWorkers.push(worker);
        }
        
        if (newWorkers.length > 0) {
            workers = newWorkers;
            showStatus(`✅ ${newWorkers.length} trabajadores importados desde Excel`, 'success');
        } else {
            showStatus('⚠️ No se encontraron trabajadores en el archivo', 'info');
        }
    } catch (error) {
        console.error('Error importando trabajadores:', error);
        throw new Error('Formato de Excel incorrecto para trabajadores: ' + error.message);
    }
}

// Importar alimentos desde Excel (sin cambios)
function importFoodsFromExcel(workbook) {
    try {
        // Buscar la hoja "Alimentos" por nombre
        let worksheetName = workbook.SheetNames.find(name => 
            name.toLowerCase().includes('alimento') || 
            name.toLowerCase().includes('food') ||
            name.toLowerCase().includes('product')
        ) || workbook.SheetNames[workbook.SheetNames.length > 1 ? 1 : 0];
        
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newFoods = [];
        const headers = data[0] || [];
        
        // Encontrar índices de columnas (más robusto)
        const nameIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('nombre')
        );
        const priceIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('precio')
        );
        const storeIndex = headers.findIndex(h => 
            h && h.toString().toLowerCase().includes('tienda')
        );
        
        // Procesar filas de datos
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            // Validar que haya al menos nombre
            if (!row[nameIndex]) continue;
            
            const food = {
                id: nextFoodId++,
                name: (row[nameIndex] || '').toString().trim(),
                price: parseFloat(row[priceIndex]) || 0,
                store: (row[storeIndex] || 'kaniki').toString().toLowerCase()
            };
            
            // Validar tienda
            if (food.store !== 'kaniki' && food.store !== 'punta_brava') {
                food.store = 'kaniki';
            }
            
            newFoods.push(food);
        }
        
        if (newFoods.length > 0) {
            foodsCatalog = newFoods;
            showStatus(`✅ ${newFoods.length} alimentos importados desde Excel`, 'success');
        } else {
            showStatus('⚠️ No se encontraron alimentos en el archivo', 'info');
        }
    } catch (error) {
        console.error('Error importando alimentos:', error);
        throw new Error('Formato de Excel incorrecto para alimentos: ' + error.message);
    }
}

// Exportar todos los datos a Excel (archivo completo MODIFICADO)
function exportAllToExcel() {
    try {
        // Crear workbook con múltiples hojas
        const wb = XLSX.utils.book_new();
        
        // Hoja 1: Trabajadores
        const workersData = [
            ['Nombre', 'Apellidos', 'Tipo Dieta', 'Días Kaniki', 'Días Punta Brava', 'Meriendas', 'Precio Merienda', 'Estímulo', 'Presupuesto Total', 'Gasto Alimentos', 'Saldo Restante']
        ];
        
        workers.forEach(worker => {
            let totalBudget = 0;
            
            if (worker.diet === 'estimulo') {
                totalBudget = worker.stimulusBalance || 0;
            } else {
                const dailyBudget = dietPrices[worker.diet] || 0;
                const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
                const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
                totalBudget = (dailyBudget * totalDays) + snackBudget;
            }
            
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            
            workersData.push([
                worker.name,
                worker.surname,
                getDietDisplayName(worker.diet),
                worker.diet === 'estimulo' ? '-' : (worker.kanikiDays || 0),
                worker.diet === 'estimulo' ? '-' : (worker.puntabravaDays || 0),
                worker.diet === 'estimulo' ? '-' : (worker.snacks || 0),
                worker.diet === 'estimulo' ? '-' : `$${(worker.snackPrice || 50).toFixed(2)}`,
                worker.diet === 'estimulo' ? `$${(worker.stimulusBalance || 0).toFixed(2)}` : '-',
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                `$${remaining.toFixed(2)}`
            ]);
        });
        
        const ws1 = XLSX.utils.aoa_to_sheet(workersData);
        
        // Hoja 2: Alimentos (sin cambios)
        const foodsData = [
            ['ID', 'Nombre', 'Precio', 'Tienda']
        ];
        
        foodsCatalog.forEach(food => {
            foodsData.push([
                food.id,
                food.name,
                `$${food.price.toFixed(2)}`,
                getStoreDisplayName(food.store)
            ]);
        });
        
        const ws2 = XLSX.utils.aoa_to_sheet(foodsData);
        
        // Hoja 3: Compras por trabajador (sin cambios)
        const purchasesData = [
            ['Trabajador', 'Alimento', 'Cantidad', 'Precio Unitario', 'Subtotal', 'Tienda']
        ];
        
        workers.forEach(worker => {
            worker.foods.forEach(food => {
                purchasesData.push([
                    `${worker.name} ${worker.surname}`,
                    food.name,
                    food.quantity,
                    `$${food.price.toFixed(2)}`,
                    `$${(food.quantity * food.price).toFixed(2)}`,
                    getStoreDisplayName(food.store)
                ]);
            });
        });
        
        const ws3 = XLSX.utils.aoa_to_sheet(purchasesData);
        
        // Agregar hojas al workbook
        XLSX.utils.book_append_sheet(wb, ws1, "Trabajadores");
        XLSX.utils.book_append_sheet(wb, ws2, "Alimentos");
        XLSX.utils.book_append_sheet(wb, ws3, "Compras");
        
        // Escribir el archivo
        XLSX.writeFile(wb, `Sistema_Alimentacion_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showStatus('✅ Todos los datos exportados a Excel', 'success');
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showStatus('❌ Error al exportar a Excel: ' + error.message, 'error');
    }
}

// Exportar reporte completo (MODIFICADO)
function exportFullReportToExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        const reportData = [
            ['REPORTE COMPLETO - SISTEMA DE ALIMENTACIÓN'],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['Total Trabajadores', workers.length],
            ['Presupuesto Total', `$${calculateTotalBudget().toFixed(2)}`],
            ['Gasto Total en Alimentos', `$${calculateTotalFoodExpense().toFixed(2)}`],
            ['Saldo Total Restante', `$${calculateTotalRemaining().toFixed(2)}`],
            [''],
            ['DETALLE POR TRABAJADOR'],
            ['Nombre', 'Apellidos', 'Tipo Dieta', 'Días Kaniki', 'Días Punta Brava', 'Estímulo', 'Presupuesto', 'Gasto', 'Saldo', 'Alimentos Comprados']
        ];
        
        workers.forEach(worker => {
            let totalBudget = 0;
            
            if (worker.diet === 'estimulo') {
                totalBudget = worker.stimulusBalance || 0;
            } else {
                const dailyBudget = dietPrices[worker.diet] || 0;
                const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
                const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
                totalBudget = (dailyBudget * totalDays) + snackBudget;
            }
            
            const foodExpense = calculateWorkerFoodExpense(worker);
            const remaining = totalBudget - foodExpense;
            
            // Crear lista de alimentos
            let alimentosList = "";
            if (worker.foods.length > 0) {
                alimentosList = worker.foods.map(f => 
                    `${f.name} (${f.quantity} x $${f.price.toFixed(2)})`
                ).join('; ');
            } else {
                alimentosList = "Sin alimentos";
            }
            
            reportData.push([
                worker.name,
                worker.surname,
                getDietDisplayName(worker.diet),
                worker.diet === 'estimulo' ? '-' : (worker.kanikiDays || 0),
                worker.diet === 'estimulo' ? '-' : (worker.puntabravaDays || 0),
                worker.diet === 'estimulo' ? `$${(worker.stimulusBalance || 0).toFixed(2)}` : '-',
                `$${totalBudget.toFixed(2)}`,
                `$${foodExpense.toFixed(2)}`,
                `$${remaining.toFixed(2)}`,
                alimentosList
            ]);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Completo");
        
        XLSX.writeFile(wb, `Reporte_Completo_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Reporte completo exportado a Excel', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// ==================== FUNCIONES DE CÁLCULO MEJORADAS ====================

// Calcular total de almuerzos normales (MODIFICADO)
function calculateNormalLunches() {
    return workers
        .filter(worker => worker.diet === 'normal')
        .reduce((total, worker) => total + (worker.kanikiDays || 0) + (worker.puntabravaDays || 0), 0);
}

// Calcular total de almuerzos mejorados (MODIFICADO)
function calculateImprovedLunches() {
    return workers
        .filter(worker => worker.diet === 'mejorada')
        .reduce((total, worker) => total + (worker.kanikiDays || 0) + (worker.puntabravaDays || 0), 0);
}

// Calcular total de meriendas
function calculateTotalSnacks() {
    return workers
        .filter(worker => worker.diet !== 'estimulo')
        .reduce((total, worker) => total + (worker.snacks || 0), 0);
}

// Calcular gasto de un trabajador
function calculateWorkerFoodExpense(worker) {
    return worker.foods.reduce((total, food) => total + (food.quantity * food.price), 0);
}

// Calcular presupuesto total (MODIFICADO)
function calculateTotalBudget() {
    return workers.reduce((total, worker) => {
        if (worker.diet === 'estimulo') {
            return total + (worker.stimulusBalance || 0);
        } else {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            return total + (dailyBudget * totalDays) + snackBudget;
        }
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

// Calcular días totales por empresa (NUEVA FUNCIÓN)
function calculateTotalDaysByStore(store) {
    return workers
        .filter(worker => worker.diet !== 'estimulo')
        .reduce((total, worker) => {
            if (store === 'kaniki') {
                return total + (worker.kanikiDays || 0);
            } else if (store === 'punta_brava') {
                return total + (worker.puntabravaDays || 0);
            }
            return total;
        }, 0);
}

// ==================== FUNCIONES DE EXPORTACIÓN MEJORADAS ====================

// Exportar Factura General MEJORADO
function exportFacturaGeneralExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Calcular totales generales
        const normalLunches = calculateNormalLunches();
        const improvedLunches = calculateImprovedLunches();
        const totalSnacks = calculateTotalSnacks();
        
        // Crear hoja con formato de factura mejorada
        const facturaData = [
            ['', '', '', '', 'Factura General No:', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['No.', 'Descripción', 'U/M', 'Cantidad', 'Precio CUP', 'Importe'],
            ['1', 'ALMUERZOS GENERALES', 'U', normalLunches, '400', normalLunches * 400],
            ['2', 'COMIDAS', 'U', '', '400', '0'],
            ['3', 'RESFUERZO MEDIO GENERAL', 'U', improvedLunches, '500', improvedLunches * 500],
            ['4', 'MERIENDAS LIGERAS', 'U', totalSnacks, '200', totalSnacks * 200],
            ['5', 'TRANSPORTACION', 'U', '', '6', '0'],
            ['IMPORTE TOTAL GENERAL', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Pagase en CUP en Cuenta Bancaria', '', '', '', '', ''],
            ['1241570000832912', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Por Restaurantes:', '', '', 'Por la ETECSA CTL Caibarién', '', ''],
            ['Nombre y Apellidos:', '', '', 'Nombre y Apellidos:', '', ''],
            ['Cargo:', '', '', 'Cargo:', '', ''],
            ['Firma:', '', '', 'Firma:', '', ''],
            ['FECHA', '', '', 'FECHA', '', '']
        ];
        
        // Calcular el importe total
        const total = (normalLunches * 400) + (improvedLunches * 500) + (totalSnacks * 200);
        facturaData[10][5] = total;
        
        const ws = XLSX.utils.aoa_to_sheet(facturaData);
        
        // Aplicar estilos para que se parezca al original
        const wscols = [
            {wch: 5},   // No.
            {wch: 25},  // Descripción
            {wch: 5},   // U/M
            {wch: 10},  // Cantidad
            {wch: 10},  // Precio CUP
            {wch: 12}   // Importe
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Factura General");
        XLSX.writeFile(wb, `Factura_General_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Factura General exportada', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar Factura Kaniki (NUEVA FUNCIÓN)
function exportFacturaKanikiExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Calcular totales para Kaniki
        const kanikiDays = calculateTotalDaysByStore('kaniki');
        const improvedKanikiDays = workers.reduce((total, worker) => {
            if (worker.diet === 'mejorada') {
                return total + (worker.kanikiDays || 0);
            }
            return total;
        }, 0);
        const normalKanikiDays = kanikiDays - improvedKanikiDays;
        
        // Calcular meriendas (asumiendo todas de Kaniki)
        const totalSnacks = calculateTotalSnacks();
        
        // Crear hoja con formato de factura Kaniki
        const facturaData = [
            ['', '', '', '', 'Factura Kaniki No:', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['No.', 'Descripción', 'U/M', 'Cantidad', 'Precio CUP', 'Importe'],
            ['1', 'ALMUERZOS KANIKI', 'U', normalKanikiDays, '400', normalKanikiDays * 400],
            ['2', 'COMIDAS', 'U', '', '400', '0'],
            ['3', 'RESFUERZO MEDIO KANIKI', 'U', improvedKanikiDays, '500', improvedKanikiDays * 500],
            ['4', 'MERIENDAS LIGERAS', 'U', totalSnacks, '200', totalSnacks * 200],
            ['5', 'TRANSPORTACION', 'U', '', '6', '0'],
            ['IMPORTE TOTAL KANIKI', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Pagase en CUP en Cuenta Bancaria', '', '', '', '', ''],
            ['1241570000832912', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Por Kaniki:', '', '', 'Por la ETECSA CTL Caibarién', '', ''],
            ['Nombre y Apellidos:', '', '', 'Nombre y Apellidos:', '', ''],
            ['Cargo:', '', '', 'Cargo:', '', ''],
            ['Firma:', '', '', 'Firma:', '', ''],
            ['FECHA', '', '', 'FECHA', '', '']
        ];
        
        // Calcular el importe total
        const total = (normalKanikiDays * 400) + (improvedKanikiDays * 500) + (totalSnacks * 200);
        facturaData[10][5] = total;
        
        const ws = XLSX.utils.aoa_to_sheet(facturaData);
        
        // Aplicar estilos
        const wscols = [
            {wch: 5},   // No.
            {wch: 25},  // Descripción
            {wch: 5},   // U/M
            {wch: 10},  // Cantidad
            {wch: 10},  // Precio CUP
            {wch: 12}   // Importe
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Factura Kaniki");
        XLSX.writeFile(wb, `Factura_Kaniki_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Factura Kaniki exportada', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar Factura Punta Brava (NUEVA FUNCIÓN)
function exportFacturaPuntaBravaExcel() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Calcular totales para Punta Brava
        const puntabravaDays = calculateTotalDaysByStore('punta_brava');
        const improvedPuntaBravaDays = workers.reduce((total, worker) => {
            if (worker.diet === 'mejorada') {
                return total + (worker.puntabravaDays || 0);
            }
            return total;
        }, 0);
        const normalPuntaBravaDays = puntabravaDays - improvedPuntaBravaDays;
        
        // Crear hoja con formato de factura Punta Brava
        const facturaData = [
            ['', '', '', '', 'Factura Punta Brava No:', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['No.', 'Descripción', 'U/M', 'Cantidad', 'Precio CUP', 'Importe'],
            ['1', 'ALMUERZOS PUNTA BRAVA', 'U', normalPuntaBravaDays, '400', normalPuntaBravaDays * 400],
            ['2', 'COMIDAS', 'U', '', '400', '0'],
            ['3', 'RESFUERZO MEDIO PUNTA BRAVA', 'U', improvedPuntaBravaDays, '500', improvedPuntaBravaDays * 500],
            ['4', 'MERIENDAS LIGERAS', 'U', '', '200', '0'],
            ['5', 'TRANSPORTACION', 'U', '', '6', '0'],
            ['IMPORTE TOTAL PUNTA BRAVA', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Pagase en CUP en Cuenta Bancaria', '', '', '', '', ''],
            ['1241570000832912', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Por Punta Brava:', '', '', 'Por la ETECSA CTL Caibarién', '', ''],
            ['Nombre y Apellidos:', '', '', 'Nombre y Apellidos:', '', ''],
            ['Cargo:', '', '', 'Cargo:', '', ''],
            ['Firma:', '', '', 'Firma:', '', ''],
            ['FECHA', '', '', 'FECHA', '', '']
        ];
        
        // Calcular el importe total
        const total = (normalPuntaBravaDays * 400) + (improvedPuntaBravaDays * 500);
        facturaData[10][5] = total;
        
        const ws = XLSX.utils.aoa_to_sheet(facturaData);
        
        // Aplicar estilos
        const wscols = [
            {wch: 5},   // No.
            {wch: 25},  // Descripción
            {wch: 5},   // U/M
            {wch: 10},  // Cantidad
            {wch: 10},  // Precio CUP
            {wch: 12}   // Importe
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Factura Punta Brava");
        XLSX.writeFile(wb, `Factura_Punta_Brava_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Factura Punta Brava exportada', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Obtener TODOS los productos de una tienda, incluso con cantidad 0
function getAllProductsByStore(store) {
    const storeProducts = [];
    
    // Obtener todos los alimentos de la tienda del catálogo
    const allStoreFoods = foodsCatalog.filter(food => food.store === store);
    
    // Crear un mapa para llevar el conteo
    const productMap = {};
    
    // Inicializar todos los productos con cantidad 0
    allStoreFoods.forEach(food => {
        productMap[food.name] = {
            id: food.id,
            price: food.price,
            quantity: 0,
            total: 0
        };
    });
    
    // Sumar las cantidades pedidas por los trabajadores
    workers.forEach(worker => {
        worker.foods.forEach(foodItem => {
            // Verificar si el alimento pertenece a la tienda actual
            const foodInfo = foodsCatalog.find(f => f.id === foodItem.id && f.store === store);
            if (foodInfo && productMap[foodInfo.name]) {
                productMap[foodInfo.name].quantity += foodItem.quantity;
                productMap[foodInfo.name].total += foodItem.quantity * foodInfo.price;
            }
        });
    });
    
    // Convertir a array ordenado
    Object.entries(productMap).forEach(([name, data], index) => {
        storeProducts.push({
            no: index + 1,
            name: name,
            price: data.price,
            quantity: data.quantity,
            total: data.total
        });
    });
    
    return storeProducts.sort((a, b) => a.name.localeCompare(b.name));
}

// Exportar Productos Caniki MEJORADO - Todos los productos
function exportProductosCanikiExcel() {
    try {
        const wb = XLSX.utils.book_new();
        const productos = getAllProductsByStore('kaniki');
        
        // Crear hoja con formato de Productos Caniki mejorado
        const productosData = [
            ['', 'ETECSA CAIBARIÉN', '', '', ''],
            ['', `Fecha: ${new Date().toLocaleDateString()}`, '', '', ''],
            ['', '', '', '', ''],
            ['No', 'Productos', 'Precio', 'Cant.', 'Imp.'],
        ];
        
        // Agregar todos los productos
        productos.forEach(producto => {
            productosData.push([
                producto.no,
                producto.name,
                producto.price,
                producto.quantity,
                producto.total
            ]);
        });
        
        // Calcular totales
        const totalCantidad = productos.reduce((sum, p) => sum + p.quantity, 0);
        const totalImporte = productos.reduce((sum, p) => sum + p.total, 0);
        
        // Agregar filas vacías si es necesario
        const rowsNeeded = 40;
        for (let i = productosData.length; i < rowsNeeded - 1; i++) {
            productosData.push(['', '', '', '', '']);
        }
        
        // Agregar fila de total
        productosData.push(['', 'TOTAL', '', totalCantidad, totalImporte]);
        
        const ws = XLSX.utils.aoa_to_sheet(productosData);
        
        // Aplicar estilos profesionales
        const wscols = [
            {wch: 5},   // No
            {wch: 35},  // Productos
            {wch: 12},  // Precio
            {wch: 10},  // Cant.
            {wch: 15}   // Imp.
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Productos Caniki");
        XLSX.writeFile(wb, `Productos_Caniki_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Productos Caniki exportados con todos los productos', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar Productos Punta Brava MEJORADO - Todos los productos
function exportProductosPuntaBravaExcel() {
    try {
        const wb = XLSX.utils.book_new();
        const productos = getAllProductsByStore('punta_brava');
        
        if (productos.length === 0) {
            showStatus('⚠️ No hay productos de Punta Brava en el catálogo', 'info');
            return;
        }
        
        // Crear hoja con formato de Productos Punta Brava mejorado
        const productosData = [
            ['', 'ETECSA CAIBARIÉN', '', '', ''],
            ['', `Fecha: ${new Date().toLocaleDateString()}`, '', '', ''],
            ['', '', '', '', ''],
            ['No', 'Productos', 'Precio', 'Cant.', 'Imp.'],
        ];
        
        // Agregar todos los productos
        productos.forEach(producto => {
            productosData.push([
                producto.no,
                producto.name,
                producto.price,
                producto.quantity,
                producto.total
            ]);
        });
        
        // Calcular totales
        const totalCantidad = productos.reduce((sum, p) => sum + p.quantity, 0);
        const totalImporte = productos.reduce((sum, p) => sum + p.total, 0);
        
        // Agregar filas vacías si es necesario
        const rowsNeeded = 40;
        for (let i = productosData.length; i < rowsNeeded - 1; i++) {
            productosData.push(['', '', '', '', '']);
        }
        
        // Agregar fila de total
        productosData.push(['', 'TOTAL', '', totalCantidad, totalImporte]);
        
        const ws = XLSX.utils.aoa_to_sheet(productosData);
        
        // Aplicar estilos profesionales
        const wscols = [
            {wch: 5},   // No
            {wch: 35},  // Productos
            {wch: 12},  // Precio
            {wch: 10},  // Cant.
            {wch: 15}   // Imp.
        ];
        ws['!cols'] = wscols;
        
        XLSX.utils.book_append_sheet(wb, ws, "Productos Punta Brava");
        XLSX.writeFile(wb, `Productos_Punta_Brava_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Productos Punta Brava exportados con todos los productos', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
}

// Exportar resumen completo de pedidos para la empresa CON ESTILOS
function exportResumenPedidosEmpresa() {
    try {
        const wb = XLSX.utils.book_new();
        
        // Resumen por tienda
        const productosKaniki = getAllProductsByStore('kaniki');
        const productosPuntaBrava = getAllProductsByStore('punta_brava');
        
        // Hoja 1: Resumen General CON ESTILOS
        const resumenData = [
            ['RESUMEN COMPLETO DE PEDIDOS'],
            ['Sistema de Gestión de Alimentación - ETECSA Caibarién'],
            ['Fecha:', new Date().toLocaleDateString()],
            ['Hora:', new Date().toLocaleTimeString()],
            [''],
            ['TOTALES GENERALES'],
            ['Total Trabajadores:', workers.length],
            ['Trabajadores con Estímulo:', workers.filter(w => w.diet === 'estimulo').length],
            ['Total Días Kaniki:', calculateTotalDaysByStore('kaniki')],
            ['Total Días Punta Brava:', calculateTotalDaysByStore('punta_brava')],
            ['Total Meriendas:', calculateTotalSnacks()],
            ['Presupuesto Total:', `$${calculateTotalBudget().toFixed(2)}`],
            ['Gasto Total en Alimentos:', `$${calculateTotalFoodExpense().toFixed(2)}`],
            ['Saldo Restante:', `$${calculateTotalRemaining().toFixed(2)}`],
            [''],
            ['RESUMEN POR TIENDA'],
            ['Tienda', 'Productos', 'Cantidad Total', 'Importe Total']
        ];
        
        const totalKaniki = productosKaniki.reduce((sum, p) => sum + p.total, 0);
        const totalCantKaniki = productosKaniki.reduce((sum, p) => sum + p.quantity, 0);
        
        const totalPuntaBrava = productosPuntaBrava.reduce((sum, p) => sum + p.total, 0);
        const totalCantPuntaBrava = productosPuntaBrava.reduce((sum, p) => sum + p.quantity, 0);
        
        resumenData.push(['Kaniki', productosKaniki.length, totalCantKaniki, totalKaniki]);
        resumenData.push(['Punta Brava', productosPuntaBrava.length, totalCantPuntaBrava, totalPuntaBrava]);
        resumenData.push(['TOTAL', productosKaniki.length + productosPuntaBrava.length, 
                         totalCantKaniki + totalCantPuntaBrava, totalKaniki + totalPuntaBrava]);
        
        const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
        
        XLSX.utils.book_append_sheet(wb, ws1, "Resumen General");
        
        // Hoja 2: Productos Kaniki
        const kanikiData = [
            ['RESUMEN DE PEDIDOS - KANIKI'],
            ['Fecha:', new Date().toLocaleDateString()],
            [''],
            ['No', 'Producto', 'Precio Unitario', 'Cantidad Pedida', 'Importe Total']
        ];
        
        productosKaniki.forEach(p => {
            kanikiData.push([p.no, p.name, p.price, p.quantity, p.total]);
        });
        
        kanikiData.push(['', 'TOTAL KANIKI', '', totalCantKaniki, totalKaniki]);
        
        const ws2 = XLSX.utils.aoa_to_sheet(kanikiData);
        
        // Hoja 3: Productos Punta Brava
        const puntabravaData = [
            ['RESUMEN DE PEDIDOS - PUNTA BRAVA'],
            ['Fecha:', new Date().toLocaleDateString()],
            [''],
            ['No', 'Producto', 'Precio Unitario', 'Cantidad Pedida', 'Importe Total']
        ];
        
        productosPuntaBrava.forEach(p => {
            puntabravaData.push([p.no, p.name, p.price, p.quantity, p.total]);
        });
        
        puntabravaData.push(['', 'TOTAL PUNTA BRAVA', '', totalCantPuntaBrava, totalPuntaBrava]);
        
        const ws3 = XLSX.utils.aoa_to_sheet(puntabravaData);
        
        // Hoja 4: Detalle por Trabajador
        const detalleData = [
            ['DETALLE DE PEDIDOS POR TRABAJADOR'],
            ['Fecha:', new Date().toLocaleDateString()],
            [''],
            ['Trabajador', 'Tipo Dieta', 'Tienda', 'Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']
        ];
        
        workers.forEach(worker => {
            worker.foods.forEach(food => {
                const foodInfo = foodsCatalog.find(f => f.id === food.id);
                if (foodInfo) {
                    detalleData.push([
                        `${worker.name} ${worker.surname}`,
                        getDietDisplayName(worker.diet),
                        getStoreDisplayName(foodInfo.store),
                        food.name,
                        food.quantity,
                        food.price,
                        food.quantity * food.price
                    ]);
                }
            });
        });
        
        const ws4 = XLSX.utils.aoa_to_sheet(detalleData);
        
        // Agregar hojas al workbook
        XLSX.utils.book_append_sheet(wb, ws2, "Pedidos Kaniki");
        XLSX.utils.book_append_sheet(wb, ws3, "Pedidos Punta Brava");
        XLSX.utils.book_append_sheet(wb, ws4, "Detalle por Trabajador");
        
        XLSX.writeFile(wb, `Resumen_Pedidos_Empresa_${new Date().toISOString().split('T')[0]}.xlsx`);
        showStatus('✅ Resumen completo de pedidos para la empresa exportado', 'success');
    } catch (error) {
        showStatus('❌ Error: ' + error.message, 'error');
    }
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

// ==================== FUNCIONES DE RENDERIZADO ====================

// Renderizar lista de trabajadores (MODIFICADA)
function renderWorkers() {
    const workersList = document.getElementById('workers-list');
    workersList.innerHTML = '';
    
    workers.forEach(worker => {
        let totalBudget = 0;
        let budgetDisplay = '';
        
        if (worker.diet === 'estimulo') {
            totalBudget = worker.stimulusBalance || 0;
            budgetDisplay = `$${totalBudget.toFixed(2)}`;
        } else {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            totalBudget = (dailyBudget * totalDays) + snackBudget;
            
            // Mostrar desglose de días por empresa
            let daysInfo = '';
            if (worker.kanikiDays > 0 && worker.puntabravaDays > 0) {
                daysInfo = `<small>(K:${worker.kanikiDays} | P:${worker.puntabravaDays})</small>`;
            } else if (worker.kanikiDays > 0) {
                daysInfo = `<small>(Kaniki: ${worker.kanikiDays})</small>`;
            } else if (worker.puntabravaDays > 0) {
                daysInfo = `<small>(Punta Brava: ${worker.puntabravaDays})</small>`;
            }
            budgetDisplay = `$${totalBudget.toFixed(2)}<br>${daysInfo}`;
        }
        
        const foodExpense = calculateWorkerFoodExpense(worker);
        const remaining = totalBudget - foodExpense;
        const percentUsed = totalBudget > 0 ? ((foodExpense / totalBudget) * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${worker.name}</strong></td>
            <td>${worker.surname}</td>
            <td><span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span></td>
            <td>${worker.diet === 'estimulo' ? '-' : `${(worker.kanikiDays || 0) + (worker.puntabravaDays || 0)}`}</td>
            <td>${worker.diet === 'estimulo' ? '-' : (worker.snacks || 0)}</td>
            <td>${worker.diet === 'estimulo' ? 'Estímulo' : `$${dietPrices[worker.diet] || 0}`}</td>
            <td>
                <strong>${budgetDisplay}</strong>
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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${food.id}</td>
            <td><strong>${food.name}</strong></td>
            <td>$${food.price.toFixed(2)}</td>
            <td>
                <span class="store-badge ${food.store}">
                    ${getStoreDisplayName(food.store)}
                </span>
            </td>
            <td>
                <button class="btn-edit btn-sm" data-id="${food.id}">✏️ Editar</button>
                <button class="btn-danger btn-sm" data-id="${food.id}">🗑️ Eliminar</button>
            </td>
        `;
        
        foodsCatalogList.appendChild(row);
    });
    
    // Event listeners para botones de alimentos
    document.querySelectorAll('#foods-catalog-list .btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const foodId = parseInt(this.dataset.id);
            openFoodCatalogModal(foodId);
        });
    });
    
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
    
    // Agrupar alimentos por nombre (puede haber mismo alimento en diferentes tiendas)
    const alimentosAgrupados = {};
    
    foodsCatalog.forEach(food => {
        if (!alimentosAgrupados[food.name]) {
            alimentosAgrupados[food.name] = [];
        }
        alimentosAgrupados[food.name].push(food);
    });
    
    // Crear opciones
    for (const nombre in alimentosAgrupados) {
        const alimentos = alimentosAgrupados[nombre];
        
        if (alimentos.length === 1) {
            // Solo una opción
            const food = alimentos[0];
            const option = document.createElement('option');
            option.value = food.id;
            option.textContent = `${food.name} - $${food.price.toFixed(2)} (${getStoreDisplayName(food.store)})`;
            option.dataset.price = food.price;
            option.dataset.store = food.store;
            foodSelect.appendChild(option);
        } else {
            // Múltiples opciones (diferentes tiendas/precios)
            alimentos.forEach(food => {
                const option = document.createElement('option');
                option.value = food.id;
                option.textContent = `${food.name} - $${food.price.toFixed(2)} (${getStoreDisplayName(food.store)})`;
                option.dataset.price = food.price;
                option.dataset.store = food.store;
                foodSelect.appendChild(option);
            });
        }
    }
}

// Mostrar detalles del trabajador CON BOTÓN DE RESET (MODIFICADA)
function showWorkerDetails(workerId) {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;
    
    currentWorkerId = workerId;
    
    // Mostrar sección de detalles
    const workerDetails = document.getElementById('worker-details');
    workerDetails.style.display = 'block';
    
    // Actualizar información del trabajador
    const workerInfo = document.getElementById('worker-info');
    
    let totalBudget = 0;
    if (worker.diet === 'estimulo') {
        totalBudget = worker.stimulusBalance || 0;
    } else {
        const dailyBudget = dietPrices[worker.diet] || 0;
        const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        totalBudget = (dailyBudget * totalDays) + snackBudget;
    }
    
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
                <div class="stat-label">📅 Días Kaniki</div>
                <div class="stat-value">${worker.diet === 'estimulo' ? '-' : (worker.kanikiDays || 0)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">📅 Días Punta Brava</div>
                <div class="stat-value">${worker.diet === 'estimulo' ? '-' : (worker.puntabravaDays || 0)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">🍎 Meriendas</div>
                <div class="stat-value">${worker.diet === 'estimulo' ? '-' : (worker.snacks || 0)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">💰 ${worker.diet === 'estimulo' ? 'Estímulo' : 'Precio por Merienda'}</div>
                <div class="stat-value">${worker.diet === 'estimulo' ? `$${(worker.stimulusBalance || 0).toFixed(2)}` : `$${(worker.snackPrice || 50).toFixed(2)}`}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">💵 ${worker.diet === 'estimulo' ? 'Saldo Estímulo' : 'Presupuesto Diario'}</div>
                <div class="stat-value">${worker.diet === 'estimulo' ? '-' : `$${dietPrices[worker.diet] || 0}`}</div>
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
        <div class="reset-confirmation" id="reset-confirmation">
            <p><strong>⚠️ ¿Estás seguro de que quieres eliminar TODOS los alimentos de este trabajador?</strong></p>
            <p>Esta acción eliminará ${worker.foods.length} alimentos de la lista.</p>
            <div style="margin-top: 10px;">
                <button id="confirm-reset" class="btn-danger">✅ Sí, eliminar todos</button>
                <button id="cancel-reset" class="btn-info">❌ Cancelar</button>
            </div>
        </div>
        <div style="margin-top: 20px; text-align: right;">
            <button id="reset-foods-btn" class="btn-reset">🗑️ Vaciar Lista de Alimentos</button>
        </div>
    `;
    
    // Renderizar lista de alimentos del trabajador
    renderWorkerFoods(worker);
    
    // Actualizar resumen
    updateWorkerSummary(worker);
    
    // Agregar event listener para el botón de reset
    document.getElementById('reset-foods-btn').addEventListener('click', function() {
        if (worker.foods.length > 0) {
            document.getElementById('reset-confirmation').style.display = 'block';
        } else {
            showStatus('ℹ️ Este trabajador no tiene alimentos en la lista', 'info');
        }
    });
    
    document.getElementById('confirm-reset').addEventListener('click', function() {
        resetWorkerFoods(worker);
    });
    
    document.getElementById('cancel-reset').addEventListener('click', function() {
        document.getElementById('reset-confirmation').style.display = 'none';
    });
}

// Renderizar alimentos de un trabajador
function renderWorkerFoods(worker) {
    const foodList = document.getElementById('food-list');
    foodList.innerHTML = '';
    
    let total = 0;
    
    worker.foods.forEach((food, index) => {
        const subtotal = food.quantity * food.price;
        total += subtotal;
        const storeName = getStoreDisplayName(food.store);
        
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

// Actualizar resumen del trabajador (MODIFICADA)
function updateWorkerSummary(worker) {
    let totalBudget = 0;
    if (worker.diet === 'estimulo') {
        totalBudget = worker.stimulusBalance || 0;
    } else {
        const dailyBudget = dietPrices[worker.diet] || 0;
        const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
        const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
        totalBudget = (dailyBudget * totalDays) + snackBudget;
    }
    
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

// Actualizar resumen general (MODIFICADA)
function updateSummary() {
    // Actualizar estadísticas generales
    const totalWorkers = workers.length;
    const totalStimulusWorkers = workers.filter(w => w.diet === 'estimulo').length;
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
        let workerBudget = 0;
        if (worker.diet === 'estimulo') {
            workerBudget = worker.stimulusBalance || 0;
        } else {
            const dailyBudget = dietPrices[worker.diet] || 0;
            const totalDays = (worker.kanikiDays || 0) + (worker.puntabravaDays || 0);
            const snackBudget = (worker.snacks || 0) * (worker.snackPrice || 50);
            workerBudget = (dailyBudget * totalDays) + snackBudget;
        }
        
        const workerFoodExpense = calculateWorkerFoodExpense(worker);
        const remaining = workerBudget - workerFoodExpense;
        
        // Si el trabajador tiene alimentos
        if (worker.foods.length > 0) {
            worker.foods.forEach((food, index) => {
                const subtotal = food.quantity * food.price;
                const storeName = getStoreDisplayName(food.store);
                
                const row = document.createElement('tr');
                
                if (index === 0) {
                    // Primera fila del trabajador - mostrar todos sus datos
                    row.innerHTML = `
                        <td rowspan="${worker.foods.length}" class="worker-name-cell">
                            <strong>${worker.name} ${worker.surname}</strong><br>
                            <span class="diet-badge ${worker.diet}">${getDietDisplayName(worker.diet)}</span>
                        </td>
                        <td>${worker.diet === 'estimulo' ? '-' : `${(worker.kanikiDays || 0) + (worker.puntabravaDays || 0)}`}</td>
                        <td>$${workerBudget.toFixed(2)}</td>
                        <td class="${remaining >= 0 ? 'positive' : 'negative'}">
                            $${remaining.toFixed(2)}
                        </td>
                        <td>${food.name}</td>
                        <td>${food.quantity}</td>
                        <td>$${subtotal.toFixed(2)}</td>
                        <td>${storeName}</td>
                    `;
                } else {
                    // Filas siguientes del mismo trabajador - solo mostrar detalles del alimento
                    row.innerHTML = `
                        <td>${worker.diet === 'estimulo' ? '-' : `${(worker.kanikiDays || 0) + (worker.puntabravaDays || 0)}`}</td>
                        <td>$${workerBudget.toFixed(2)}</td>
                        <td class="${remaining >= 0 ? 'positive' : 'negative'}">
                            $${remaining.toFixed(2)}
                        </td>
                        <td>${food.name}</td>
                        <td>${food.quantity}</td>
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
                <td>${worker.diet === 'estimulo' ? '-' : `${(worker.kanikiDays || 0) + (worker.puntabravaDays || 0)}`}</td>
                <td>$${workerBudget.toFixed(2)}</td>
                <td class="positive">$${remaining.toFixed(2)}</td>
                <td colspan="4" class="no-foods">Sin alimentos registrados</td>
            `;
            summaryList.appendChild(row);
        }
    });
}

// ==================== FUNCIONES DE MODALES ====================

// Abrir modal para añadir/editar trabajador (MODIFICADA)
function openWorkerModal(workerId = null) {
    const modal = document.getElementById('worker-modal');
    const title = document.getElementById('worker-modal-title');
    const form = document.getElementById('worker-form');
    
    // Obtener elementos del formulario
    const dietSelect = document.getElementById('worker-diet');
    const daysFields = document.getElementById('days-fields');
    const stimulusField = document.getElementById('stimulus-field');
    const meriendasField = document.getElementById('meriendas-fields');
    
    if (workerId) {
        // Modo edición
        title.textContent = '✏️ Editar Trabajador';
        const worker = workers.find(w => w.id === workerId);
        
        if (worker) {
            document.getElementById('worker-id').value = worker.id;
            document.getElementById('worker-name').value = worker.name;
            document.getElementById('worker-surname').value = worker.surname;
            document.getElementById('worker-diet').value = worker.diet;
            
            // Mostrar campos según tipo de dieta
            if (worker.diet === 'estimulo') {
                daysFields.style.display = 'none';
                meriendasField.style.display = 'none';
                stimulusField.style.display = 'block';
                document.getElementById('stimulus-balance').value = worker.stimulusBalance || 0;
            } else {
                daysFields.style.display = 'block';
                meriendasField.style.display = 'block';
                stimulusField.style.display = 'none';
                document.getElementById('kaniki-days').value = worker.kanikiDays || 0;
                document.getElementById('puntabrava-days').value = worker.puntabravaDays || 0;
                document.getElementById('worker-snacks').value = worker.snacks || 0;
                document.getElementById('snack-price').value = worker.snackPrice || 50;
            }
        }
    } else {
        // Modo añadir
        title.textContent = '➕ Añadir Trabajador';
        form.reset();
        document.getElementById('worker-id').value = '';
        document.getElementById('worker-snacks').value = 0;
        document.getElementById('snack-price').value = 50;
        document.getElementById('kaniki-days').value = 0;
        document.getElementById('puntabrava-days').value = 0;
        document.getElementById('stimulus-balance').value = 0;
        
        // Mostrar campos por defecto (normal)
        daysFields.style.display = 'block';
        meriendasField.style.display = 'block';
        stimulusField.style.display = 'none';
    }
    
    modal.style.display = 'flex';
}

// Guardar trabajador (añadir o editar) (MODIFICADA)
function saveWorker() {
    const id = document.getElementById('worker-id').value;
    const name = document.getElementById('worker-name').value;
    const surname = document.getElementById('worker-surname').value;
    const diet = document.getElementById('worker-diet').value;
    
    if (!name || !surname) {
        showStatus('❌ Por favor, completa todos los campos obligatorios', 'error');
        return;
    }
    
    if (diet === 'estimulo') {
        // Manejo de estímulo
        const stimulusBalance = parseFloat(document.getElementById('stimulus-balance').value) || 0;
        
        if (id) {
            // Editar trabajador existente
            const workerIndex = workers.findIndex(w => w.id === parseInt(id));
            if (workerIndex !== -1) {
                workers[workerIndex].name = name;
                workers[workerIndex].surname = surname;
                workers[workerIndex].diet = diet;
                workers[workerIndex].stimulusBalance = stimulusBalance;
                // Limpiar campos no utilizados
                workers[workerIndex].kanikiDays = 0;
                workers[workerIndex].puntabravaDays = 0;
                workers[workerIndex].snacks = 0;
                workers[workerIndex].snackPrice = 0;
            }
        } else {
            // Añadir nuevo trabajador con estímulo
            const newWorker = {
                id: nextWorkerId++,
                name: name,
                surname: surname,
                diet: diet,
                stimulusBalance: stimulusBalance,
                kanikiDays: 0,
                puntabravaDays: 0,
                snacks: 0,
                snackPrice: 0,
                foods: []
            };
            workers.push(newWorker);
        }
    } else {
        // Manejo de dietas normales/mejoradas
        const kanikiDays = parseInt(document.getElementById('kaniki-days').value) || 0;
        const puntabravaDays = parseInt(document.getElementById('puntabrava-days').value) || 0;
        const snacks = parseInt(document.getElementById('worker-snacks').value);
        const snackPrice = parseFloat(document.getElementById('snack-price').value);
        
        if (id) {
            // Editar trabajador existente
            const workerIndex = workers.findIndex(w => w.id === parseInt(id));
            if (workerIndex !== -1) {
                workers[workerIndex].name = name;
                workers[workerIndex].surname = surname;
                workers[workerIndex].diet = diet;
                workers[workerIndex].kanikiDays = kanikiDays;
                workers[workerIndex].puntabravaDays = puntabravaDays;
                workers[workerIndex].snacks = snacks;
                workers[workerIndex].snackPrice = snackPrice;
                // Limpiar campo de estímulo
                workers[workerIndex].stimulusBalance = 0;
            }
        } else {
            // Añadir nuevo trabajador
            const newWorker = {
                id: nextWorkerId++,
                name: name,
                surname: surname,
                diet: diet,
                kanikiDays: kanikiDays,
                puntabravaDays: puntabravaDays,
                snacks: snacks,
                snackPrice: snackPrice,
                stimulusBalance: 0,
                foods: []
            };
            workers.push(newWorker);
        }
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

// Abrir modal para añadir/editar alimento al catálogo
function openFoodCatalogModal(foodId = null) {
    const modal = document.getElementById('food-catalog-modal');
    const title = document.getElementById('food-catalog-modal-title');
    const form = document.getElementById('food-catalog-form');
    
    if (foodId) {
        // Modo edición
        title.textContent = '✏️ Editar Alimento';
        const food = foodsCatalog.find(f => f.id === foodId);
        
        if (food) {
            document.getElementById('food-catalog-id').value = food.id;
            document.getElementById('food-catalog-name').value = food.name;
            document.getElementById('food-catalog-price').value = food.price;
            document.getElementById('food-catalog-store').value = food.store;
        }
    } else {
        // Modo añadir
        title.textContent = '➕ Añadir Alimento al Catálogo';
        form.reset();
        document.getElementById('food-catalog-id').value = '';
    }
    
    modal.style.display = 'flex';
}

// Guardar alimento en el catálogo (añadir o editar)
function saveFoodCatalog() {
    const id = document.getElementById('food-catalog-id').value;
    const name = document.getElementById('food-catalog-name').value;
    const price = parseFloat(document.getElementById('food-catalog-price').value);
    const store = document.getElementById('food-catalog-store').value;
    
    if (!name || !price || price <= 0) {
        showStatus('❌ Por favor, completa todos los campos correctamente', 'error');
        return;
    }
    
    if (id) {
        // Editar alimento existente
        const foodIndex = foodsCatalog.findIndex(f => f.id === parseInt(id));
        if (foodIndex !== -1) {
            foodsCatalog[foodIndex].name = name;
            foodsCatalog[foodIndex].price = price;
            foodsCatalog[foodIndex].store = store;
        }
    } else {
        // Añadir nuevo alimento
        const newFood = {
            id: nextFoodId++,
            name: name,
            price: price,
            store: store
        };
        
        foodsCatalog.push(newFood);
    }
    
    // Cerrar modal y actualizar interfaz
    document.getElementById('food-catalog-modal').style.display = 'none';
    document.getElementById('food-catalog-form').reset();
    renderFoodsCatalog();
    saveDataToLocalStorage();
    
    showStatus(`✅ Alimento "${name}" guardado correctamente`, 'success');
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

// Añadir alimento a trabajador
function addFoodToWorker() {
    if (!currentWorkerId) {
        showStatus('❌ Primero selecciona un trabajador', 'error');
        return;
    }
    
    const foodSelect = document.getElementById('food-select');
    const foodId = parseInt(foodSelect.value);
    const quantity = parseInt(document.getElementById('food-quantity').value);
    
    if (!foodId || !quantity || quantity < 1) {
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
    
    // Añadir alimento al trabajador
    worker.foods.push({
        id: food.id,
        name: food.name,
        quantity: quantity,
        price: food.price,
        store: food.store
    });
    
    // Actualizar interfaz
    renderWorkerFoods(worker);
    updateWorkerSummary(worker);
    saveDataToLocalStorage();
    
    // Limpiar formulario
    document.getElementById('food-quantity').value = 1;
    
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

// Resetear todos los alimentos de un trabajador
function resetWorkerFoods(worker) {
    if (!worker || !worker.foods || worker.foods.length === 0) return;
    
    const foodCount = worker.foods.length;
    worker.foods = [];
    
    // Actualizar interfaz
    renderWorkerFoods(worker);
    updateWorkerSummary(worker);
    updateSummary();
    saveDataToLocalStorage();
    
    // Ocultar confirmación
    document.getElementById('reset-confirmation').style.display = 'none';
    
    showStatus(`✅ Se eliminaron ${foodCount} alimentos de la lista de ${worker.name}`, 'success');
}

// ==================== FUNCIONES AUXILIARES ====================

// Función auxiliar para mostrar nombre de dieta (MODIFICADA)
function getDietDisplayName(diet) {
    const dietNames = {
        normal: 'Normal',
        mejorada: 'Mejorada',
        estimulo: 'Estímulo'
    };
    return dietNames[diet] || diet;
}

// Función auxiliar para mostrar nombre de tienda
function getStoreDisplayName(store) {
    return storeNames[store] || store;
}

// ==================== FUNCIONES DE SEGURIDAD Y BACKUP ====================

// Mostrar indicador de guardado
function showSaveIndicator(type) {
    const indicator = document.getElementById('auto-save-indicator');
    if (!indicator) return;
    
    indicator.style.display = 'flex';
    
    switch(type) {
        case 'saving':
            indicator.innerHTML = '💾 Guardando automáticamente...';
            indicator.className = 'auto-save-indicator';
            break;
        case 'success':
            indicator.innerHTML = '✅ Datos guardados';
            indicator.className = 'auto-save-indicator auto-save-success';
            break;
        case 'error':
            indicator.innerHTML = '❌ Error al guardar';
            indicator.className = 'auto-save-indicator auto-save-error';
            break;
    }
}

// Ocultar indicador
function hideSaveIndicator() {
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// Obtener contador de guardados
function getSaveCount() {
    try {
        const data = localStorage.getItem('foodManagementData');
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.saveCount || 0;
        }
    } catch (error) {
        console.error('Error obteniendo contador:', error);
    }
    return 0;
}

// Recuperar datos desde copia de seguridad
function restoreFromBackup() {
    try {
        const backup = localStorage.getItem('foodManagementBackup');
        if (backup) {
            const data = JSON.parse(backup);
            
            workers = data.workers || [];
            foodsCatalog = data.foodsCatalog || [];
            nextWorkerId = data.nextWorkerId || 1;
            nextFoodId = data.nextFoodId || 1;
            
            renderWorkers();
            renderFoodsCatalog();
            updateSummary();
            
            showStatus('✅ Datos recuperados desde copia de seguridad', 'success');
            return true;
        }
    } catch (error) {
        console.error('Error recuperando backup:', error);
    }
    return false;
}

// Verificar integridad de datos
function verifyDataIntegrity() {
    try {
        const data = localStorage.getItem('foodManagementData');
        if (!data) return false;
        
        const parsed = JSON.parse(data);
        
        // Verificar estructura básica
        if (!parsed.workers || !parsed.foodsCatalog) {
            console.warn('Estructura de datos inválida');
            return false;
        }
        
        // Verificar que los arrays sean arrays
        if (!Array.isArray(parsed.workers) || !Array.isArray(parsed.foodsCatalog)) {
            console.warn('Datos no son arrays');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error verificando integridad:', error);
        return false;
    }
}

// Función para exportar backup manual
function exportBackup() {
    try {
        const data = {
            workers: workers,
            foodsCatalog: foodsCatalog,
            nextWorkerId: nextWorkerId,
            nextFoodId: nextFoodId,
            exportDate: new Date().toISOString(),
            exportType: 'backup'
        };
        
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_alimentacion_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus('✅ Copia de seguridad exportada', 'success');
    } catch (error) {
        showStatus('❌ Error exportando backup: ' + error.message, 'error');
    }
}

// ==================== NUEVAS FUNCIONES PARA ESTÍMULO ====================

// Función para aplicar estímulo a TODOS los trabajadores
// Función para aplicar estímulo a TODOS los trabajadores
function applyStimulusToAll() {
    const stimulusAmount = parseFloat(prompt('Ingrese el monto del estímulo para TODOS los trabajadores:', '0'));
    
    if (isNaN(stimulusAmount) || stimulusAmount <= 0) {
        showStatus('❌ Monto inválido', 'error');
        return;
    }
    
    if (confirm(`¿Está seguro de cambiar a TODOS los trabajadores a dieta "Estímulo" con un saldo de $${stimulusAmount.toFixed(2)}?\n\nEsta acción afectará a ${workers.length} trabajadores y no se puede deshacer.`)) {
        workers.forEach(worker => {
            // Cambiar la dieta a "estimulo" para todos
            worker.diet = 'estimulo';
            worker.stimulusBalance = stimulusAmount; // CORRECCIÓN: usar stimulusAmount, no stimulusBalance
            // Limpiar campos de días y meriendas
            worker.kanikiDays = 0;
            worker.puntabravaDays = 0;
            worker.snacks = 0;
            worker.snackPrice = 0;
        });
        
        renderWorkers();
        updateSummary();
        saveDataToLocalStorage();
        
        // Si estamos viendo los detalles de un trabajador, actualizarlos
        if (currentWorkerId) {
            const worker = workers.find(w => w.id === currentWorkerId);
            if (worker) {
                showWorkerDetails(currentWorkerId);
            }
        }
        
        showStatus(`✅ Todos los trabajadores cambiados a estímulo con $${stimulusAmount.toFixed(2)}`, 'success');
    }
}

// ==================== CONFIGURACIÓN DE EVENTOS ====================

// Configurar event listeners (MODIFICADA)
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
    
    // Botón aplicar estímulo a todos - Asegurar que esté conectado
    document.getElementById('apply-stimulus-btn').addEventListener('click', function() {
        applyStimulusToAll();
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
    
    document.getElementById('export-resumen-pedidos-btn').addEventListener('click', function() {
        exportResumenPedidosEmpresa();
    });
    
    // Botones de plantillas
    document.getElementById('download-template-btn').addEventListener('click', function() {
        downloadExcelTemplates();
    });
    
    // Botones de exportación específicos
    document.getElementById('export-full-excel-btn').addEventListener('click', function() {
        exportFullReportToExcel();
    });
    
    // Botones de exportación de facturas por empresa
    document.getElementById('export-factura-general-btn').addEventListener('click', function() {
        exportFacturaGeneralExcel();
    });
    
    document.getElementById('export-factura-kaniki-btn').addEventListener('click', function() {
        exportFacturaKanikiExcel();
    });
    
    document.getElementById('export-factura-puntabrava-btn').addEventListener('click', function() {
        exportFacturaPuntaBravaExcel();
    });
    
    // Botón para exportar resumen de pedidos (versión 2 - desde pestaña Excel)
    document.getElementById('export-resumen-pedidos-btn2').addEventListener('click', function() {
        exportResumenPedidosEmpresa();
    });
    
    // Botón de backup
    document.getElementById('backup-btn').addEventListener('click', exportBackup);
    
    // Botones de importación Excel desde la pestaña Excel
    document.querySelectorAll('.import-excel-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            document.getElementById('import-file').setAttribute('data-type', type + '-excel');
            document.getElementById('import-file').click();
        });
    });
    
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
    
    // Manejar cambio de dieta en el formulario
    document.getElementById('worker-diet').addEventListener('change', function() {
        const diet = this.value;
        const daysFields = document.getElementById('days-fields');
        const stimulusField = document.getElementById('stimulus-field');
        const meriendasField = document.getElementById('meriendas-fields');
        
        if (diet === 'estimulo') {
            daysFields.style.display = 'none';
            meriendasField.style.display = 'none';
            stimulusField.style.display = 'block';
        } else {
            daysFields.style.display = 'block';
            meriendasField.style.display = 'block';
            stimulusField.style.display = 'none';
        }
    });
}

// ==================== GUARDADO PERIÓDICO ====================

// Guardado periódico cada 30 segundos (como respaldo extra)
function setupPeriodicSave() {
    setInterval(() => {
        if (!isSaving) {
            console.log('🔄 Guardado periódico automático...');
            saveDataToLocalStorage();
        }
    }, 30000); // 30 segundos
}

// ==================== DETECCIÓN DE CIERRE DEL NAVEGADOR ====================

// Guardar datos cuando el usuario cierre la pestaña/navegador
function setupBeforeUnload() {
    window.addEventListener('beforeunload', function(event) {
        if (!isSaving) {
            console.log('⚠️ Usuario cerrando página, guardando datos...');
            saveDataToLocalStorage();
        }
    });
    
    // También guardar cuando se cambia de pestaña
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && !isSaving) {
            console.log('🔄 Pestaña oculta, guardando datos...');
            saveDataToLocalStorage();
        }
    });
}