import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const GET_SALES = gql`
  query GetSales {
    sales {
      id
      category
      brand
      quantity
      price
      amount
      month
    }
  }
`;

const ADD_SALE = gql`
  mutation AddSale(
    $category: String!
    $brand: String!
    $quantity: Int!
    $price: Float!
    $month: String!
  ) {
    addSale(
      category: $category
      brand: $brand
      quantity: $quantity
      price: $price
      month: $month
    ) {
      id
      amount
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
  sales: any[] = [];
  chart: any;
  goalChart: any;

  months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  brands: any = {
    Gaseosas: ['Coca Cola', 'Pepsi'],
    Aguas: ['San Luis', 'San Mateo'],
  };
  brandLogos: any = {
    'Coca Cola':
      'https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg',
    Pepsi:
      'https://upload.wikimedia.org/wikipedia/commons/0/0f/Pepsi_logo_2014.svg',
    'San Luis':
      'https://images.seeklogo.com/logo-png/0/1/agua-san-luis-logo-png_seeklogo-4731.png',
    'San Mateo':
      'https://estudiocrater.com/wp-content/uploads/2017/11/SM-01-1.jpg',
  };

  newSale = { category: '', brand: '', quantity: 1, price: 0, month: '' };
  filter = { category: '', brand: '', month: '' };

  targetGoal: number = 100;
  currentProgress: number = 0;

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales() {
    this.apollo
      .watchQuery<any>({ query: GET_SALES })
      .valueChanges.subscribe(({ data }) => {
        this.sales = data?.sales ?? [];
        this.renderCharts();
      });
  }

  add() {
    if (
      !this.newSale.category ||
      !this.newSale.brand ||
      !this.newSale.month ||
      this.newSale.price <= 0
    )
      return;

    this.apollo
      .mutate({
        mutation: ADD_SALE,
        variables: { ...this.newSale },
        refetchQueries: [{ query: GET_SALES }],
      })
      .subscribe(() => {
        this.newSale = {
          category: '',
          brand: '',
          quantity: 1,
          price: 0,
          month: '',
        };
      });
  }

  getSum(cat: string) {
    const filtered = this.sales.filter((s) => s.category === cat);
    return {
      qty: filtered.reduce((acc, s) => acc + (s.quantity || 0), 0),
      amt: filtered.reduce((acc, s) => acc + (s.amount || 0), 0),
    };
  }

  renderCharts() {
    this.renderMainChart();
    this.renderGoalChart();
  }

  renderMainChart() {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const filtered = this.sales.filter(
      (s) =>
        (!this.filter.category || s.category === this.filter.category) &&
        (!this.filter.brand || s.brand === this.filter.brand) &&
        (!this.filter.month || s.month === this.filter.month)
    );

    const grouped = new Map<string, number>();
    filtered.forEach((s) =>
      grouped.set(s.brand, (grouped.get(s.brand) || 0) + s.amount)
    );

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from(grouped.keys()),
        datasets: [
          {
            label: 'Monto S/',
            data: Array.from(grouped.values()),
            backgroundColor: Array.from(grouped.keys()).map((b) =>
              this.sales.find((s) => s.brand === b)?.category === 'Gaseosas'
                ? '#ef4444'
                : '#3b82f6'
            ),
            borderRadius: 5,
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  renderGoalChart() {
    const ctx = document.getElementById('goalChart') as HTMLCanvasElement;
    if (!ctx) return;

    const filtered = this.sales.filter(
      (s) => !this.filter.month || s.month === this.filter.month
    );
    this.currentProgress = filtered.reduce((acc, s) => acc + s.quantity, 0);
    const remain = Math.max(0, this.targetGoal - this.currentProgress);

    if (this.goalChart) this.goalChart.destroy();
    this.goalChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vendido', 'Faltante'],
        datasets: [
          {
            data: [this.currentProgress, remain],
            backgroundColor: ['#22c55e', '#e2e8f0'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: '80%',
        plugins: { legend: { display: false } },
      },
    });
  }

  getBrandTotal(brandName: string) {
    const brandSales = this.sales.filter((s) => s.brand === brandName);
    return {
      qty: brandSales.reduce((acc, s) => acc + (s.quantity || 0), 0),
      amt: brandSales.reduce((acc, s) => acc + (s.amount || 0), 0),
    };
  }
}
