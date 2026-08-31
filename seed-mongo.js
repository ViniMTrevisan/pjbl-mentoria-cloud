// Popula o MongoDB Atlas com os mentores iniciais do PJBL.
// Uso: MONGODB_URI="mongodb+srv://..." node seed-mongo.js
const { MongoClient } = require('./api/node_modules/mongodb');
const { mentores } = require('./api/src/data/mock');

(async () => {
  const cliente = await new MongoClient(process.env.MONGODB_URI).connect();
  const colecao = cliente.db('pjbl_mentoria').collection('mentores');
  await colecao.deleteMany({});
  const docs = mentores
    .filter((m) => m.ehMentor)
    .map(({ id, ehMentor, ehMentorado, ...m }) => ({ ...m, criadoEm: new Date().toISOString() }));
  const r = await colecao.insertMany(docs);
  await colecao.createIndex({ nome: 1 });
  console.log(`inseridos: ${r.insertedCount}`);
  console.log(await colecao.find({}, { projection: { nome: 1, curso: 1 } }).toArray());
  await cliente.close();
})();
