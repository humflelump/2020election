import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as constants from './constants';
import {
  ComposedChart, Legend, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { keyBy, sortBy } from 'lodash';
import { Divider, InputLabel, MenuItem, Select, Typography } from '@material-ui/core';
import PolynomialRegression from "js-polynomial-regression";
import * as d3 from 'd3';
constants.log();

const data = constants.getData();

function round1(n: number) {
  return Math.round(n * 10) / 10
}

interface Props {

}

function fit(points: { x: number, y: number }[], poly = 2) {
  //Factory function - returns a PolynomialRegression instance. 2nd argument is the degree of the desired polynomial equation.
  const model = PolynomialRegression.read(points, poly);
  //terms is a list of coefficients for a polynomial equation. We'll feed these to predict y so that we don't have to re-compute them for every prediction.
  const terms = model.getTerms();

  return points.map(point => {
    return {
      ...point,
      fit: model.predictY(terms, point.x)
    }
  })
  // const range = d3.extent(points, d => d.x)
  // const newPoints: { x: number, fit: number }[] = []
  // for (let x = range[0]; x < range[1]; x += (range[1] - range[0]) / 50) {
  //   newPoints.push({
  //     x,
  //     fit: model.predictY(terms, x),
  //   })
  // }
  // return [...points, ...newPoints];
}

const Widget = React.memo((props: Props) => {
  const [state, setState] = React.useState('Texas');
  const [polyDegree, setPolyDegree] = React.useState(1);
  const [year1, setYear1] = React.useState(2016);
  const [year2, setYear2] = React.useState(2020);
  const subset = data.filter(d => d.state === state);
  const data1 = subset.filter(d => d.year === year1);
  const data2 = subset.filter(d => d.year === year2);
  const index1 = keyBy(data1, d => d.name);
  const index2 = keyBy(data2, d => d.name);
  const names = Object.keys(index1);

  const diffBySize = names.map(name => {
    const dp1 = index1[name];
    const dp2 = index2[name];
    const x = (dp1.total + dp2.total) / 2;
    const diff1 = (dp1.dem / dp1.total) - (dp1.gop / dp1.total);
    const diff2 = (dp2.dem / dp2.total) - (dp2.gop / dp2.total);
    const y = 100 * (diff2 - diff1);
    return { x, y, name, dem1: 100 * dp1.dem / dp1.total, dem2: 100 * dp2.dem / dp2.total };
  });

  const diffByDemPartisanship = names.map(name => {
    const dp1 = index1[name];
    const dp2 = index2[name];
    const x = 100 * (dp1.dem + dp2.dem) / (dp1.total + dp2.total);
    const diff1 = (dp1.dem / dp1.total) - (dp1.gop / dp1.total);
    const diff2 = (dp2.dem / dp2.total) - (dp2.gop / dp2.total);
    const y = 100 * (diff2 - diff1);
    return { x, y, name }
  });

  const totalGop1 = d3.sum(data1.map(d => d.gop));
  const totalGop2 = d3.sum(data2.map(d => d.gop));
  const totalDem1 = d3.sum(data1.map(d => d.dem));
  const totalDem2 = d3.sum(data2.map(d => d.dem));
  const total1 = totalGop1 + totalDem1;
  const total2 = totalGop2 + totalDem2;

  const sortByDemPartisanShip = sortBy(subset, d => d.dem / d.total);
  const mostDem = sortByDemPartisanShip.slice(Math.floor(0.75 * subset.length), subset.length);
  const mostGop = sortByDemPartisanShip.slice(0, Math.floor(0.25 * subset.length));


  return <div>
    <div style={{ display: 'flex' }}>
      <div style={{ margin: 10 }}>
        <InputLabel>State</InputLabel>
        <Select
          value={state}
          onChange={e => setState(String(e.target.value))}
        >
          {
            constants.STATE_OPTIONS.map(state => {
              return <MenuItem value={state}>{state}</MenuItem>
            })
          }
        </Select>
      </div>
      <div style={{ margin: 10 }}>
        <InputLabel>Best Fit Degree</InputLabel>
        <Select
          value={polyDegree}
          onChange={e => setPolyDegree(Number(e.target.value))}
        >
          {
            [1, 2, 3, 4, 5, 6].map(d => {
              return <MenuItem value={d}>{d}</MenuItem>
            })
          }
        </Select>
      </div>
      <div style={{ margin: 10 }}>
        <InputLabel>Start Year</InputLabel>
        <Select
          value={year1}
          onChange={e => setYear1(Number(e.target.value))}
        >
          {
            [2008, 2012, 2016, 2020].map(d => {
              return <MenuItem value={d}>{d}</MenuItem>
            })
          }
        </Select>
      </div>
      <div style={{ margin: 10 }}>
        <InputLabel>End Year</InputLabel>
        <Select
          value={year2}
          onChange={e => setYear2(Number(e.target.value))}
        >
          {
            [2008, 2012, 2016, 2020].map(d => {
              return <MenuItem value={d}>{d}</MenuItem>
            })
          }
        </Select>
      </div>
      <div style={{ margin: 10 }}>
        <button onClick={() => {
          setYear1(2008);
          setYear2(2012);
        }}>2012</button>
      </div>
      <div style={{ margin: 10 }}>
        <button onClick={() => {
          setYear1(2012);
          setYear2(2016);
        }}>2016</button>
      </div>
      <div style={{ margin: 10 }}>
        <button onClick={() => {
          setYear1(2016);
          setYear2(2020);
        }}>2020</button>
      </div>
    </div>
    <Typography>
      {`${year1}: Democrats ${round1(totalDem1 * 100 / total1)}%, Republicans ${round1(totalGop1 * 100 / total1)}%`}
    </Typography>
    <Typography>
      {`${year2}: Democrats ${round1(totalDem2 * 100 / total2)}%, Republicans ${round1(totalGop2 * 100 / total2)}%`}
    </Typography>
    <Typography>
      {`Mean Improvement: ${round1(2 * (totalDem2 * 100 / total2 - totalDem1 * 100 / total1))}%, Median Improvement: ${round1(d3.median(diffBySize.map(d => d.y)))}%`}
    </Typography>
    <Divider />
    <Typography style={{ fontWeight: 600 }}>
      {`Democratic Point Improvement from ${year1} to ${year2} vs Size of County in the state of ${state}`}
    </Typography>
    <ScatterChart
      width={1200}
      height={400}
      margin={{
        top: 20, right: 20, bottom: 20, left: 20,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="Average Vote Count" unit=" People" />
      <YAxis type="number" dataKey="y" name="Democratic Point Improvement" unit="%" />
      <Tooltip content={({ active, payload }) => {
        if (!active) return null;
        const data = payload[0] && payload[0].payload;
        return <div style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
          <div>{`${data.name}`}</div>
          <div>{`Average Vote Count: ${Math.round(data.x)} People`}</div>
          <div>{`Democratic Point Improvement: ${round1(data.y)}%`}</div>
          <div>{`${year1} Democratic Partisanship: ${round1(data.dem1)}%`}</div>
          <div>{`${year2} Democratic Partisanship: ${round1(data.dem2)}%`}</div>
        </div>
      }} />
      <Scatter name="A school" data={fit(diffBySize, polyDegree)} fill="#8884d8" />
    </ScatterChart>

    <Typography style={{ fontWeight: 600 }}>
      {`Democratic Point Improvement from ${year1} to ${year2} vs Democratic Partisanship in the state of ${state}`}
    </Typography>
    <ComposedChart
      width={1000}
      height={400}
      margin={{
        top: 20, right: 80, bottom: 20, left: 20,
      }}
      data={fit(diffByDemPartisanship, polyDegree)}
    >
      <CartesianGrid stroke="#f5f5f5" />
      <Tooltip />
      <Legend />

      <XAxis type="number" dataKey="x" name="Percent Democratic" unit="%" />
      <YAxis type="number" dataKey="y" name="Democratic Point Improvement" unit="%" />
      <Scatter name="" fill="#8884d8" />
      <Line dataKey="fit" stroke="red" dot={false} activeDot={false} legendType="none" />
    </ComposedChart>
  </div>

});



function App() {
  return (
    <div className="App">
      <Widget />
    </div>
  );
}

export default App;
