import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '@antv/g2plot';

const GET_SALES = gql`
  query GetSales($category: String, $brand: String) {
    sales(category: $category, brand: $brand) {
      id month quantity price amount goalQty goalAmt category brand
    }
  }
`;

const ADD_SALE = gql`
  mutation AddSale($category: String!, $brand: String!, $quantity: Float, $price: Float, $month: String!, $goalQty: Float, $goalAmt: Float) {
    addSale(category: $category, brand: $brand, quantity: $quantity, price: $price, month: $month, goalQty: $goalQty, goalAmt: $goalAmt) {
      id amount
    }
  }
`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  filter = { category: '', brand: '' };
  chartViewFilter = { category: 'Todas', metric: 'Cantidad' };
  tableData: any = {};
  allSalesData: any[] = []; 
  
  histogramPlot: any;

  brandsByCategory: any = {
    Agua: ['San Luis', 'San Mateo'],
    Gaseosa: ['Coca Cola', 'Pepsi'],
  };
  filteredBrands: string[] = [];

  brandColors: any = {
    'Coca Cola': '#ef4444',
    'Pepsi': '#1e40af',
    'San Mateo': '#0ea5e9',
    'San Luis': '#22c55e',
  };

  brandLogos: any = {
    'Coca Cola': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg',
    'Pepsi': 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Pepsi_logo_2014.svg',
    'San Luis': 'https://images.seeklogo.com/logo-png/0/1/agua-san-luis-logo-png_seeklogo-4731.png',
    'San Mateo': 'https://estudiocrater.com/wp-content/uploads/2017/11/SM-01-1.jpg',
  };

  constructor(private apollo: Apollo) { 
    this.initTable(); 
  }

  ngOnInit() { 
    this.loadChartData(); 
  }

  initTable() {
    this.months.forEach((m) => {
      this.tableData[m] = { quantity: 0, price: 0, goalQty: 0, goalAmt: 0, amount: 0 };
    });
  }

  onCategoryChange() {
    this.filter.brand = '';
    this.filteredBrands = this.brandsByCategory[this.filter.category] || [];
    this.loadData();
  }

  loadData() {
    if (!this.filter.category || !this.filter.brand) return;
    this.apollo.watchQuery<any>({
      query: GET_SALES,
      variables: { category: this.filter.category, brand: this.filter.brand },
      fetchPolicy: 'network-only',
    }).valueChanges.subscribe(({ data }) => {
      this.initTable();
      if (data.sales) {
        data.sales.forEach((s: any) => this.tableData[s.month] = { ...s });
      }
      this.renderHistogram();
    });
  }

  loadChartData() {
    this.apollo.watchQuery<any>({
      query: GET_SALES,
      variables: {}, 
      fetchPolicy: 'network-only',
    }).valueChanges.subscribe(({ data }) => {
      this.allSalesData = data.sales || [];
      this.renderHistogram();
    });
  }

  renderHistogram() {
  const container = document.getElementById('histogram-container');
  if (!container) return;

  let filtered = [...this.allSalesData];
  if (this.chartViewFilter.category !== 'Todas') {
    filtered = filtered.filter(d => d.category === this.chartViewFilter.category);
  }

  const plotData = filtered.map(d => {
    const qty = Number(d.quantity) || 0;
    const price = Number(d.price) || 0;
    return {
      mes: d.month,
      valor: this.chartViewFilter.metric === 'Cantidad' ? qty : (qty * price),
      marca: d.brand
    };
  }).filter(d => d.valor > 0)
    .sort((a, b) => this.months.indexOf(a.mes) - this.months.indexOf(b.mes));

  if (this.histogramPlot) this.histogramPlot.destroy();
  if (plotData.length === 0) return;

  this.histogramPlot = new Column(container, {
    data: plotData,
    xField: 'mes',
    yField: 'valor',
    seriesField: 'marca',
    isGroup: true,
    color: ({ marca }) => this.brandColors[marca] || '#cbd5e1',
    legend: { position: 'top', layout: 'horizontal' },
    
    // === HE ELIMINADO LA SECCIÓN 'label' PARA QUITAR LOS PRECIOS DE LAS BARRAS ===

    meta: {
      mes: { type: 'cat', values: this.months },
      valor: { 
        formatter: (v) => this.chartViewFilter.metric === 'Venta' ? `S/ ${v.toLocaleString()}` : v 
      }
    },
    tooltip: {
      shared: true,
      showMarkers: false,
      customContent: (title, items) => {
        if (!items || items.length === 0) return '';
        let html = `<div style="padding:10px;"><div style="font-weight:bold; margin-bottom:8px;">${title}</div>`;
        items.forEach((item: any) => {
          const logo = this.brandLogos[item.name] || '';
          // Usamos item.data.valor para obtener el número real y darle formato
          const valNum = Number(item.data.valor) || 0;
          const displayValue = this.chartViewFilter.metric === 'Venta' 
            ? `S/ ${valNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
            : valNum;
            
          html += `<div style="display:flex; align-items:center; margin-bottom:6px;">
            <span style="background-color:${item.color}; width:8px; height:8px; border-radius:50%; margin-right:8px;"></span>
            <img src="${logo}" style="width:20px; height:20px; object-fit:contain; margin-right:8px;" />
            <span style="flex:1; margin-right:15px;">${item.name}:</span>
            <span style="font-weight:bold;">${displayValue}</span>
          </div>`;
        });
        return html + '</div>';
      }
    }
  });
  this.histogramPlot.render();
}

  saveRow(month: string) {
    const row = this.tableData[month];
    if (!this.filter.category || !this.filter.brand) return alert('Seleccione categoría y marca');
    
    this.apollo.mutate({
      mutation: ADD_SALE,
      variables: { 
        category: this.filter.category, 
        brand: this.filter.brand, 
        month, 
        quantity: Number(row.quantity), 
        price: Number(row.price), 
        goalQty: Number(row.goalQty), 
        goalAmt: Number(row.goalAmt) 
      }
    }).subscribe(() => {
      alert(`Datos de ${month} guardados.`);
      this.loadChartData(); 
    });
  }

  // Helpers de cálculo
  getQtyProfit(m: string) { return (this.tableData[m].quantity || 0) - (this.tableData[m].goalQty || 0); }
  getQtyVariation(m: string) {
    const row = this.tableData[m];
    return row.goalQty ? (row.quantity / row.goalQty - 1) * 100 : 0;
  }
  getQtyScore(m: string) {
    const row = this.tableData[m];
    return row.goalQty ? (row.quantity / row.goalQty) * 100 : 0;
  }
  getAmtProfit(m: string) {
    const row = this.tableData[m];
    return (row.quantity * row.price) - (row.goalAmt || 0);
  }
  getVariation(m: string) {
    const row = this.tableData[m];
    const total = row.quantity * row.price;
    return row.goalAmt ? (total / row.goalAmt - 1) * 100 : 0;
  }
  getScore(m: string) {
    const row = this.tableData[m];
    const total = row.quantity * row.price;
    return row.goalAmt ? (total / row.goalAmt) * 100 : 0;
  }
}