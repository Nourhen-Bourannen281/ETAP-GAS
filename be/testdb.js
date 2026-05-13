const { MongoClient } = require('mongodb');
require('dotenv').config();

// Test avec format SRV (le plus simple)
const uri = "mongodb+srv://pfe_user:pfe123456%21@cluster0.j9gyxdb.mongodb.net/?retryWrites=true&w=majority";

console.log("📱 TEST AVEC PARTAGE 4G");
console.log("=".repeat(50));
console.log("Vérifiez que vous êtes bien connecté au téléphone !");
console.log("");

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
});

async function test() {
    console.log("⏳ Connexion à MongoDB Atlas via 4G...");
    
    try {
        await client.connect();
        console.log("✅✅✅ CONNEXION RÉUSSIE ! ✅✅✅");
        console.log("");
        
        // Afficher les infos
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();
        
        console.log("📂 Bases de données trouvées:");
        dbs.databases.forEach(db => {
            console.log(`   📁 ${db.name}`);
        });
        
        // Tester la base pfe
        const db = client.db("pfe");
        const collections = await db.listCollections().toArray();
        
        console.log(`\n📋 Collections dans 'pfe':`);
        if (collections.length === 0) {
            console.log("   (aucune collection pour l'instant)");
        } else {
            collections.forEach(coll => console.log(`   - ${coll.name}`));
        }
        
        // Insertion test
        console.log("\n✍️ Test d'insertion...");
        const testColl = db.collection("test_4g");
        const result = await testColl.insertOne({
            message: "Connexion depuis partage 4G",
            date: new Date(),
            test: "success"
        });
        console.log(`✅ Document inséré: ${result.insertedId}`);
        
        await testColl.deleteOne({ _id: result.insertedId });
        console.log("🗑️ Document supprimé");
        
        console.log("\n🎉 TOUT FONCTIONNE PARFAITEMENT !");
        console.log("=".repeat(50));
        console.log("\n✅ CONCLUSION: Le problème vient de votre réseau principal");
        console.log("   (votre FAI ou réseau professionnel bloque le port 27017)");
        
    } catch (err) {
        console.error("\n❌ ERREUR:", err.message);
        console.log("\n📋 Si ça ne marche pas même en 4G:");
        console.log("   - Vérifiez que votre téléphone a bien accès à internet");
        console.log("   - Désactivez le pare-feu Windows temporairement");
        console.log("   - Redémarrez Node.js");
        
        if (err.message.includes("querySrv ECONNREFUSED")) {
            console.log("\n💡 Le DNS ne fonctionne pas même en 4G.");
            console.log("   Essayez avec IP directe:");
            console.log("   mongodb://pfe_user:pfe123456%21@13.58.235.120:27017/?authSource=admin");
        }
    } finally {
        await client.close();
    }
}

test();