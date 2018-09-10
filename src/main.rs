#![feature(rust_2018_preview)]
#![feature(plugin)]
#![plugin(rocket_codegen)]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
extern crate serde_json;

mod chart;
mod dino;
mod dino_tree;
mod update;
mod users;
mod vault;

use dino_tree::DinoTree;
use rocket::config::{Config, Environment};

use std::sync::RwLock;

use crate::vault::*;

fn main() -> Result<(), String> {
    let profile_json = read_profiles()?;
    let profiles = profile_json.as_array().unwrap();
    let dinos: Vec<dino::Dino> = profiles
        .iter()
        .filter_map(|v| dino::Dino::from(v))
        .collect();
    println!("got {} dinos", dinos.len());
    let tree = DinoTree::from(dinos.iter()).unwrap_or_default();
    println!("got {} dinos", tree.t.len());
    let forrest = RwLock::new(tree);

    let config = Config::build(Environment::Staging)
        .port(8888)
        .finalize()
        .map_err(|e| format!("{}", e))?;
    rocket::custom(config, true)
        .mount("/related/", routes![chart::related])
        .mount("/orgchart", routes![chart::orgchart])
        .mount("/update", routes![update::cis_update])
        .mount("/users", routes![users::users])
        .manage(forrest)
        .launch();
    Ok(())
}
