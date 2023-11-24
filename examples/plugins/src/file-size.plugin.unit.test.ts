import {expect, describe, it} from 'vitest';
import {assertFileSize, errorMessage, infoMessage} from "./file-size.plugin";
import {basename, join} from "path";

const file = 'test.js';

describe('infoMessage', () => {
  it.each([
    ['index.js'],
    [join('src', 'index.js')]
  ])('should return info message', (file) => {
    expect(infoMessage(file)).toEqual(`File ${basename(file)} is OK`);
  })
})
describe('errorMessage', () => {
  it.each([
    [1, 0],
    [2, 1],
  ])('should return error message', (size, budget) => {
    const sizeDifference = Math.min(size - budget, 0);
    expect(errorMessage('test.js', size, budget)).toEqual(`File ${file} is ${size} B this is ${sizeDifference} B too big. (budget: ${budget} B)`);
  })
})
describe('assertFileSize', () => {
  it.each([
    [-1],
    [0],
    [1],
  ])('should return informative Issue with without budgets', (size) => {
    expect(assertFileSize(file, size)).toEqual({
      message: infoMessage(file),
      severity: "info",
      source: { file }
    },);
  });

  it.each([
    [0, 0],
    [0, 1],
    [1, 1],
  ])('should return informative Issue with with budgets not exceeding (size: %s, budget: %s)', (size, budget) => {
    expect(assertFileSize(file, size, budget)).toEqual({
      message: infoMessage(file),
      severity: "info",
      source: { file }
    });
  });

  it.each([
    [1, 0],
    [2, 1],
  ])('should return error Issue with with budgets exceeding (size: %s, budget: %s)', (size, budget) => {
    console.log('size: ', size, 'budget', budget);
    expect(assertFileSize(file, size, budget)).toEqual({
      message: errorMessage(file, size, budget),
      severity: "error",
      source: { file }
    });
  });

});

describe('errorMessage', () => {
  it.each([
    [1, 0],
    [2, 1],
  ])('should return error message', (size, budget) => {
    const sizeDifference = Math.min(size - budget, 0);
    expect(errorMessage('test.js', size, budget)).toEqual(`File ${file} is ${size} B this is ${sizeDifference} B too big. (budget: ${budget} B)`);
  })
})
