import { Component, OnInit } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Consultas GraphQL
const GET_SALES = gql`
  query GetSales {
    sales {
      id
      category
      brand
      quantity
      price
      amount
    }
  }
`;

const ADD_SALE = gql`
  mutation AddSale(
    $category: String!
    $brand: String!
    $quantity: Int!
    $price: Float!
  ) {
    addSale(
      category: $category
      brand: $brand
      quantity: $quantity
      price: $price
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

  // Modelos para formularios y filtros
  newSale = { category: '', brand: '', quantity: 1, price: 0 };
  filter = { category: '', brand: '' };

  // Configuración de marcas y logos (URLs externas para asegurar que carguen)
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

  constructor(private apollo: Apollo) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales() {
    this.apollo
      .watchQuery<any>({ query: GET_SALES })
      .valueChanges.subscribe(({ data }) => {
        this.sales = data?.sales ?? [];
        this.renderChart();
      });
  }

  add() {
    if (
      !this.newSale.category ||
      !this.newSale.brand ||
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
        this.newSale = { category: '', brand: '', quantity: 1, price: 0 };
      });
  }

  getSum(cat: string) {
    const filtered = this.sales.filter((s) => s.category === cat);
    return {
      qty: filtered.reduce((acc, s) => acc + (s.quantity || 0), 0),
      amt: filtered.reduce((acc, s) => acc + (s.amount || 0), 0),
    };
  }

  renderChart() {
    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const filteredSales = this.sales.filter((s) => {
      const matchCat =
        !this.filter.category || s.category === this.filter.category;
      const matchBrand = !this.filter.brand || s.brand === this.filter.brand;
      return matchCat && matchBrand;
    });

    const grouped = new Map<string, number>();
    filteredSales.forEach((s) => {
      const current = grouped.get(s.brand) || 0;
      grouped.set(s.brand, current + (s.amount || 0));
    });

    const labels = Array.from(grouped.keys());
    const dataValues = Array.from(grouped.values());

    const colors = labels.map((label) => {
      const item = this.sales.find((s) => s.brand === label);
      return item?.category === 'Gaseosas' ? '#ef4444' : '#3b82f6';
    });

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Monto Total (S/)',
            data: dataValues,
            backgroundColor: colors,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }
}
